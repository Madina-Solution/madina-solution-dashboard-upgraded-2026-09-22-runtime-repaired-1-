"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Package,
  Palette,
  Folder,
  ArrowRight,
  Clock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type SearchResult = {
  type: "product" | "service" | "category";
  id: string;
  name: string;
  slug: string;
  description?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function SearchDialog({ isOpen, onClose }: Props) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [recentSearches, setRecentSearches] = React.useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem("madina-recent-searches");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedIndex, setSelectedIndex] = React.useState(-1);

  // Focus/reset when dialog toggles
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset state when closing — use ref to avoid effect setState
  const wasOpen = React.useRef(false);
  React.useEffect(() => {
    if (!isOpen && wasOpen.current) {
      setQuery("");
      setResults([]);
      setSelectedIndex(-1);
    }
    wasOpen.current = isOpen;
  }, [isOpen]);

  const handleResultClick = React.useCallback((result: SearchResult) => {
    // Save to recent searches
    const newRecent = [
      result.name,
      ...recentSearches.filter((s) => s !== result.name),
    ].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem("madina-recent-searches", JSON.stringify(newRecent));

    // Navigate
    let path = "/";
    if (result.type === "product") {
      path = `/products/${result.slug}`;
    } else if (result.type === "service") {
      path = `/services/${result.slug}`;
    } else if (result.type === "category") {
      path = `/products/category/${result.slug}`;
    }

    router.push(path);
    onClose();
  }, [recentSearches, router, onClose]);

  // Keyboard navigation
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        handleResultClick(results[selectedIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose, handleResultClick]);

  // Search with debounce
  React.useEffect(() => {
    const normalizedQuery = query.trim();
    const timer = setTimeout(async () => {
      if (!normalizedQuery) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(normalizedQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, normalizedQuery ? 300 : 0);
    return () => clearTimeout(timer);
  }, [query]);

  const handleRecentClick = (term: string) => {
    setQuery(term);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("madina-recent-searches");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "product":
        return <Package className="h-4 w-4" />;
      case "service":
        return <Palette className="h-4 w-4" />;
      case "category":
        return <Folder className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-dark/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-xl -translate-x-1/2 px-4"
          >
            <div className="overflow-hidden rounded-2xl bg-white shadow-premium-lg">
              {/* Search Input */}
              <div className="flex items-center border-b border-dark-100 px-4">
                <Search className="h-5 w-5 text-dark-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari produk, layanan, atau kategori..."
                  className="flex-1 bg-transparent px-4 py-4 text-base outline-none placeholder:text-dark-400"
                />
                {isLoading && (
                  <Loader2 className="h-5 w-5 animate-spin text-dark-400" />
                )}
                {query && !isLoading && (
                  <button
                    onClick={() => setQuery("")}
                    className="p-1 text-dark-400 hover:text-dark"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <div className="ml-2 hidden rounded-lg bg-dark-100 px-2 py-1 text-xs text-dark-500 sm:block">
                  ESC
                </div>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto">
                {/* Recent Searches */}
                {!query && recentSearches.length > 0 && (
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-dark-500">
                        Pencarian Terakhir
                      </span>
                      <button
                        onClick={clearRecentSearches}
                        className="text-sm text-primary hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                    <div className="mt-3 space-y-1">
                      {recentSearches.map((term, index) => (
                        <button
                          key={index}
                          onClick={() => handleRecentClick(term)}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-dark-50"
                        >
                          <Clock className="h-4 w-4 text-dark-400" />
                          <span className="text-dark-600">{term}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search Results */}
                {query && results.length > 0 && (
                  <div className="p-2">
                    {results.map((result, index) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors",
                          selectedIndex === index
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-dark-50"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-xl",
                            result.type === "product" && "bg-blue-100 text-blue-600",
                            result.type === "service" && "bg-purple-100 text-purple-600",
                            result.type === "category" && "bg-green-100 text-green-600"
                          )}
                        >
                          {getIcon(result.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-dark">{result.name}</p>
                          <p className="text-sm text-dark-500 capitalize">
                            {result.type === "product" && "Produk"}
                            {result.type === "service" && "Layanan"}
                            {result.type === "category" && "Kategori"}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-dark-400" />
                      </button>
                    ))}
                  </div>
                )}

                {/* No Results */}
                {query && !isLoading && results.length === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-dark-500">
                      Tidak ada hasil untuk &quot;{query}&quot;
                    </p>
                    <Button variant="outline" className="mt-4" asChild>
                      <a href="/contact">Hubungi Kami</a>
                    </Button>
                  </div>
                )}

                {/* Empty State */}
                {!query && recentSearches.length === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-dark-500">
                      Ketik untuk mencari produk, layanan, atau kategori
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-dark-100 px-4 py-3">
                <div className="flex items-center justify-between text-xs text-dark-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="rounded bg-dark-100 px-1.5 py-0.5">↑</kbd>
                      <kbd className="rounded bg-dark-100 px-1.5 py-0.5">↓</kbd>
                      <span>navigasi</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="rounded bg-dark-100 px-1.5 py-0.5">↵</kbd>
                      <span>pilih</span>
                    </span>
                  </div>
                  <span>Madina Solution</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
