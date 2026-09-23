import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
export default async function ArticleNotFound() {
  const t = await getTranslations("BlogArticle");
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-dark-100"><FileText className="h-10 w-10 text-dark-400" /></div>
      <h1 className="mt-6 text-2xl font-bold text-dark">{t("articleNotFound")}</h1>
      <p className="mt-2 text-dark-500">{t("articleNotFoundText")}</p>
      <Button className="mt-8" asChild><Link href="/blog"><ArrowLeft className="mr-2 h-4 w-4" />{t("back")}</Link></Button>
    </div>
  );
}
