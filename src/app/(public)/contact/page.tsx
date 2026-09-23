import { Metadata } from "next";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/constants";
import { ContactForm } from "./contact-form";
import { getPublicSiteConfig } from "@/lib/site-config";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({ title: "Kontak", description: "Hubungi Madina Solution untuk konsultasi desain, printing, branding, advertising, dan kebutuhan visual bisnis.", path: "/contact" });

export default async function ContactPage() {
  const site = await getPublicSiteConfig();
  return (
    <div className="py-12 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        {/* Header */}
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Hubungi Kami
          </span>
          <h1 className="mt-3 text-4xl font-bold text-dark lg:text-5xl">
            Kami Siap Membantu
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-dark-600">
            Ada pertanyaan atau ingin konsultasi? Tim kami siap membantu Anda.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {/* Contact Info */}
          <div className="space-y-6">
            <Card>
              <CardContent className="flex items-start gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-dark">Alamat</h3>
                  <p className="mt-1 text-sm text-dark-500">{site.siteAddress}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-dark">WhatsApp</h3>
                  <a
                    href={`https://wa.me/${site.siteWhatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-sm text-primary hover:underline"
                  >
                    {site.sitePhone}
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-dark">Email</h3>
                  <a
                    href={`mailto:${site.siteEmail}`}
                    className="mt-1 block text-sm text-primary hover:underline"
                  >
                    {site.siteEmail}
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-dark">Jam Operasional</h3>
                  <p className="mt-1 text-sm text-dark-500">
                    Senin - Sabtu: 08:00 - 17:00 WIB
                  </p>
                  <p className="text-sm text-dark-500">
                    Minggu: Libur
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp Button */}
            <Button className="w-full" size="lg" asChild>
              <a
                href={`https://wa.me/${BRAND.whatsapp}?text=Halo%20Madina%20Solution%2C%20saya%20ingin%20bertanya%20tentang%20layanan%20Anda.`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Chat WhatsApp
              </a>
            </Button>
          </div>

          {/* Contact Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Kirim Pesan</CardTitle>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <div className="mt-16">
          <Card className="overflow-hidden">
            <div className="aspect-[21/9] bg-dark-100">
              <iframe
                src={site.mapsEmbedUrl || undefined}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Lokasi Madina Solution"
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
