import { MessageSquare, Palette, Settings, Truck, CheckCircle } from "lucide-react";

const steps = [
  { step: 1, icon: MessageSquare, title: "Konsultasi", description: "Hubungi kami untuk konsultasi kebutuhan desain dan cetak bisnis Anda." },
  { step: 2, icon: Palette, title: "Desain", description: "Tim desainer kami akan membuat desain sesuai brief atau Anda upload file sendiri." },
  { step: 3, icon: Settings, title: "Produksi", description: "Setelah desain disetujui, pesanan langsung masuk proses produksi." },
  { step: 4, icon: CheckCircle, title: "Quality Control", description: "Setiap produk melewati pengecekan kualitas sebelum dikemas." },
  { step: 5, icon: Truck, title: "Pengiriman", description: "Produk siap dikirim atau diambil langsung di lokasi kami." },
];

export function Process() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">Proses Kerja</span>
          <h2 className="mt-3 text-3xl font-bold text-dark sm:text-4xl lg:text-5xl">Cara Kami Bekerja</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-dark-600">Proses yang transparan dan efisien untuk hasil terbaik</p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((item) => (
            <div key={item.step} className="text-center">
              <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-primary text-white shadow-lg">
                <item.icon className="h-6 w-6" />
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-dark text-xs font-bold text-white">{item.step}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-dark">{item.title}</h3>
              <p className="mt-2 text-sm text-dark-500">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
