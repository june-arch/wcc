// prisma/seed.ts
import { PrismaClient, BookingStatus } from "@prisma/client";
import { hashPassword } from "@better-auth/utils/password";

const prisma = new PrismaClient();

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

async function main() {
  // ============================================================
  // 1. SEED USER (Owner) menggunakan better-auth
  // ============================================================
  console.log("🌱 Seeding user...");
  const existingUser = await prisma.user.findUnique({
    where: { email: "riskayolan5@gmail.com" },
  });

  let userId: string;

  if (!existingUser) {
    const hashedPassword = await hashPassword("@Takterduga1");
    userId = generateId();

    await prisma.user.create({
      data: {
        id: userId,
        email: "riskayolan5@gmail.com",
        name: "Riska Yulanda Saputri",
        emailVerified: true,
      },
    });

    await prisma.account.create({
      data: {
        id: generateId(),
        userId: userId,
        accountId: userId,
        providerId: "credential",
        password: hashedPassword,
      },
    });

    console.log("✅ Seeded user: Riska Yulanda Saputri");
  } else {
    const hashedPassword = await hashPassword("@Takterduga1");
    const existingAccount = await prisma.account.findFirst({
      where: { userId: existingUser.id, providerId: "credential" },
    });

    if (existingAccount) {
      await prisma.account.update({
        where: { id: existingAccount.id },
        data: { password: hashedPassword },
      });
    } else {
      await prisma.account.create({
        data: {
          id: generateId(),
          userId: existingUser.id,
          accountId: existingUser.id,
          providerId: "credential",
          password: hashedPassword,
        },
      });
    }
    userId = existingUser.id;
    console.log("✅ Updated user password: Riska Yulanda Saputri");
  }

  // ============================================================
  // 2. SEED EVENT TYPES (Master Data)
  // ============================================================
  console.log("🌱 Seeding event types...");

  const eventTypes = [
    { id: "lamaran", name: "LAMARAN", label: "Lamaran", description: "Acara lamaran", isActive: true, sortOrder: 1 },
    { id: "pengajian", name: "PENGAJIAN", label: "Pengajian", description: "Acara pengajian", isActive: true, sortOrder: 2 },
    { id: "akad-malam", name: "AKAD_MALAM", label: "Akad Malam", description: "Akad nikah di malam hari", isActive: true, sortOrder: 3 },
    { id: "akad-siang", name: "AKAD_SIANG", label: "Akad Siang", description: "Akad nikah di siang hari", isActive: true, sortOrder: 4 },
    { id: "resepsi", name: "RESEPSI", label: "Resepsi", description: "Acara resepsi pernikahan", isActive: true, sortOrder: 5 },
    { id: "tamat-kaji", name: "TAMAT_KAJI", label: "Tamat Kaji", description: "Acara tamat kaji", isActive: true, sortOrder: 6 },
    { id: "lainnya", name: "LAINNYA", label: "Lainnya", description: "Jenis acara lain", isActive: true, sortOrder: 7 },
  ];

  for (const et of eventTypes) {
    await prisma.eventType.upsert({
      where: { id: et.id },
      update: {},
      create: et,
    });
  }
  console.log("✅ Seeded", eventTypes.length, "event types");

  // ============================================================
  // 3. SEED PRICE PACKAGES (Master Data)
  // ============================================================
  console.log("🌱 Seeding price packages...");

  const pricePackages = [
    {
      id: "lamaran",
      name: "Lamaran",
      price: 550,
      description: "Unlimited instagram stories shoot by iphone 16, Unlimited video editing compilation sameday, 1-2 trend tiktok, 2-3 video recap/cinematic, instagram take over, unlimited raw photo & video, file google drive",
      isActive: true,
      sortOrder: 1,
      eventTypeIds: ["lainnya"],
    },
    {
      id: "akad-malam-only",
      name: "Akad Malam Only",
      price: 550,
      description: "Unlimited instagram stories shoot by iphone 16, Unlimited video editing compilation sameday, 1-2 trend tiktok, 2-3 video recap/cinematic, instagram take over, unlimited raw photo & video, file google drive",
      isActive: true,
      sortOrder: 2,
      eventTypeIds: ["akad-malam"],
    },
    {
      id: "resepsi-only",
      name: "Resepsi Only",
      price: 650,
      description: "Unlimited instagram stories shoot by iphone 16, Unlimited video editing compilation sameday, 1-2 trend tiktok, 2-3 video recap/cinematic, instagram take over, unlimited raw photo & video, file google drive",
      isActive: true,
      sortOrder: 3,
      eventTypeIds: ["resepsi"],
    },
    {
      id: "akad-malam-resepsi-same",
      name: "Akad Malam & Resepsi (Hari Sama)",
      price: 750,
      description: "Unlimited instagram stories shoot by iphone 16, Unlimited video editing compilation sameday, 2-4 trend tiktok, Unlimited video recap/cinematic, instagram take over, unlimited raw photo & video, file google drive",
      isActive: true,
      sortOrder: 4,
      eventTypeIds: ["akad-malam", "resepsi"],
    },
    {
      id: "akad-malam-resepsi-diff",
      name: "Akad Malam & Resepsi (Beda Hari)",
      price: 1000,
      description: "Unlimited instagram stories shoot by iphone 16, Unlimited video editing compilation sameday, 2-4 trend tiktok, Unlimited video recap/cinematic, instagram take over, unlimited raw photo & video, file google drive",
      isActive: true,
      sortOrder: 5,
      eventTypeIds: ["akad-malam", "resepsi"],
    },
    {
      id: "pengajian",
      name: "Pengajian",
      price: 400,
      description: "Unlimited instagram stories shoot, video editing, 1 trend tiktok, file google drive",
      isActive: true,
      sortOrder: 6,
      eventTypeIds: ["pengajian"],
    },
    {
      id: "tamat-kaji",
      name: "Tamat Kaji",
      price: 200,
      description: "Instagram stories shoot, video highlights, file google drive",
      isActive: true,
      sortOrder: 7,
      eventTypeIds: ["tamat-kaji"],
    },
  ];

  for (const pkg of pricePackages) {
    const { eventTypeIds, ...pkgData } = pkg;

    await prisma.pricePackage.upsert({
      where: { id: pkg.id },
      update: {},
      create: {
        ...pkgData,
        packageEventTypes: {
          create: eventTypeIds.map((etId) => ({
            eventTypeId: etId,
          })),
        },
      },
    });
  }
  console.log("✅ Seeded", pricePackages.length, "price packages");

  // ============================================================
  // 4. SEED ADD-ONS (Master Data)
  // ============================================================
  console.log("🌱 Seeding add-ons...");

  const addOns = [
    { id: "stand-by-full", name: "Stand by dari awal - akhir acara", price: 0, description: "Dokumentasi penuh dari persiapan hingga akhir acara", isActive: true },
    { id: "transport-sarolangun", name: "Transportasi Sarolangun", price: 0, description: "Free transport untuk area Kota Sarolangun (10km dari base)", isActive: true },
    { id: "transport-luar", name: "Transportasi Luar Kota", price: 150, description: "Biaya tambahan transportasi untuk luar area Kota Sarolangun", isActive: true },
    { id: "konsultasi-konsep", name: "Konsultasi Konsep", price: 0, description: "Free konsultasi konsep yang diinginkan", isActive: true },
    { id: "all-file-drive", name: "All File via Google Drive", price: 0, description: "Semua file dikirim via Google Drive", isActive: true },
    { id: "free-photo-phone", name: "Free Photo by Phone", price: 0, description: "Foto tambahan menggunakan handphone", isActive: true },
    { id: "extra-reels", name: "Extra Reels/Tiktok", price: 50, description: "Tambahan 2-3 video reels/tiktok", isActive: true },
    { id: "same-day-edit", name: "Same Day Edit Video", price: 100, description: "Video highlight yang diedit di hari yang sama", isActive: true },
  ];

  for (const addon of addOns) {
    await prisma.addOn.upsert({
      where: { id: addon.id },
      update: {},
      create: addon,
    });
  }
  console.log("✅ Seeded", addOns.length, "add-ons");

  // ============================================================
  // 5. SEED BOOKINGS (Data dari Screenshot)
  // ============================================================
  console.log("🌱 Seeding bookings...");

  const bookingsData = [
    {
      id: "jannah-sahal",
      clientName: "Jannah & Sahal",
      hashtag: "#SAHuntilJANNAH",
      location: "S. baung",
      notes: "Lunas - Paket: Akad & Resepsi Beda Hari + Transport Luar Kota",
      startDate: new Date("2026-04-05"),
      endDate: new Date("2026-04-06"),
      status: BookingStatus.CONFIRMED,
      isConfirmed: true,
      pricePackageId: "akad-malam-resepsi-diff",
      eventTypeIds: ["pengajian", "akad-malam", "resepsi"],
      transport: 150,
      discount: 0,
      addOns: [{ addOnId: "transport-luar", price: 150 }],
      payments: [
        { amount: 800, note: "Lunas - CASH", paidAt: new Date("2026-03-01") },
      ],
    },
    {
      id: "hasni-romadhon",
      clientName: "Hasni & Romadhon",
      hashtag: "#ROMAnticmomentwithHasni",
      location: "S. Baung",
      notes: "Lunas - Paket: Akad & Resepsi Beda Hari",
      startDate: new Date("2026-04-19"),
      endDate: new Date("2026-04-20"),
      status: BookingStatus.CONFIRMED,
      isConfirmed: false,
      pricePackageId: "akad-malam-resepsi-diff",
      eventTypeIds: ["pengajian", "akad-malam", "resepsi"],
      transport: 0,
      discount: 0,
      addOns: [],
      payments: [
        { amount: 800, note: "DP - TRANSFER", paidAt: new Date("2026-03-15") },
      ],
    },
    {
      id: "wardatul-alvin",
      clientName: "Wardatul Jannah & Alvin",
      hashtag: "#WarLoVinDay",
      location: "Karmen",
      notes: "DP 300k - Sisa 800k - Paket: Akad & Resepsi Beda Hari + Transport Luar Kota",
      startDate: new Date("2026-04-03"),
      endDate: new Date("2026-04-04"),
      status: BookingStatus.CONFIRMED,
      isConfirmed: true,
      pricePackageId: "akad-malam-resepsi-diff",
      eventTypeIds: ["akad-malam", "resepsi"],
      transport: 150,
      discount: 0,
      addOns: [{ addOnId: "transport-luar", price: 150 }],
      payments: [
        { amount: 300, note: "DP - TRANSFER", paidAt: new Date("2026-03-10") },
      ],
    },
    {
      id: "aini-ziska",
      clientName: "Aini & Ziska",
      hashtag: "#DicintAiniZiska",
      location: "Danau Serdang Pauh",
      notes: "Belum transport - DP 300k - Resepsi Only",
      startDate: new Date("2026-06-03"),
      endDate: new Date("2026-06-03"),
      status: BookingStatus.PENDING,
      isConfirmed: false,
      pricePackageId: "resepsi-only",
      eventTypeIds: ["resepsi"],
      transport: 0,
      discount: 0,
      addOns: [{ addOnId: "transport-sarolangun", price: 0 }],
      payments: [
        { amount: 300, note: "DP - TRANSFER", paidAt: new Date("2026-05-01") },
      ],
    },
    {
      id: "lia-april",
      clientName: "Lia & April",
      hashtag: "#APRthingforLIA",
      location: "Panti",
      notes: "DP 300k - Paket: Akad & Resepsi Beda Hari",
      startDate: new Date("2026-04-11"),
      endDate: new Date("2026-04-12"),
      status: BookingStatus.PENDING,
      isConfirmed: false,
      pricePackageId: "akad-malam-resepsi-diff",
      eventTypeIds: ["akad-malam", "resepsi"],
      transport: 0,
      discount: 0,
      addOns: [],
      payments: [
        { amount: 300, note: "DP - TRANSFER", paidAt: new Date("2026-03-20") },
      ],
    },
    {
      id: "ima",
      clientName: "Ima",
      hashtag: null,
      location: null,
      notes: "DP 500k - Sisa 400k - Paket: Akad & Resepsi Hari Sama + Extra Reels + Same Day Edit",
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-07-01"),
      status: BookingStatus.PENDING,
      isConfirmed: false,
      pricePackageId: "akad-malam-resepsi-same",
      eventTypeIds: ["akad-malam", "resepsi"],
      transport: 0,
      discount: 0,
      addOns: [
        { addOnId: "extra-reels", price: 50 },
        { addOnId: "same-day-edit", price: 100 },
      ],
      payments: [
        { amount: 500, note: "DP - TRANSFER", paidAt: new Date("2026-06-01") },
      ],
    },
    {
      id: "diah-habib",
      clientName: "Diah & Habib",
      hashtag: "#DihalalinHABIB",
      location: null,
      notes: "1 hari - DP 200k - Sisa 700k - Paket: Akad & Resepsi Hari Sama + Extra Reels + Same Day Edit",
      startDate: new Date("2026-04-30"),
      endDate: new Date("2026-04-30"),
      status: BookingStatus.PENDING,
      isConfirmed: false,
      pricePackageId: "akad-malam-resepsi-same",
      eventTypeIds: ["akad-malam", "resepsi"],
      transport: 0,
      discount: 0,
      addOns: [
        { addOnId: "extra-reels", price: 50 },
        { addOnId: "same-day-edit", price: 100 },
      ],
      payments: [
        { amount: 200, note: "DP - TRANSFER", paidAt: new Date("2026-04-01") },
      ],
    },
    {
      id: "aci-paris",
      clientName: "Aci & Paris",
      hashtag: "#ACIPARISah",
      location: null,
      notes: "DP 200k - Sisa 800k - Paket: Akad & Resepsi Beda Hari",
      startDate: new Date("2026-06-14"),
      endDate: new Date("2026-06-15"),
      status: BookingStatus.PENDING,
      isConfirmed: false,
      pricePackageId: "akad-malam-resepsi-diff",
      eventTypeIds: ["akad-malam", "resepsi"],
      transport: 0,
      discount: 0,
      addOns: [],
      payments: [
        { amount: 200, note: "DP - TRANSFER", paidAt: new Date("2026-05-15") },
      ],
    },
    {
      id: "tesi-najmal",
      clientName: "Tesi & Najmal",
      hashtag: "#TESIMALinlove",
      location: null,
      notes: "Tamat Kaji - Lunas 200k",
      startDate: new Date("2026-04-26"),
      endDate: new Date("2026-04-26"),
      status: BookingStatus.PENDING,
      isConfirmed: false,
      pricePackageId: "tamat-kaji",
      eventTypeIds: ["tamat-kaji"],
      transport: 0,
      discount: 0,
      addOns: [],
      payments: [
        { amount: 200, note: "Lunas - CASH", paidAt: new Date("2026-04-20") },
      ],
    },
    {
      id: "ilmi-irwan",
      clientName: "Ilmi & Irwan",
      hashtag: "#TheONEforILMI",
      location: "sungai baung",
      notes: "Paket: Akad & Resepsi Beda Hari + Transport Luar Kota",
      startDate: new Date("2026-04-08"),
      endDate: new Date("2026-04-09"),
      status: BookingStatus.PENDING,
      isConfirmed: false,
      pricePackageId: "akad-malam-resepsi-diff",
      eventTypeIds: ["akad-malam", "resepsi"],
      transport: 150,
      discount: 0,
      addOns: [{ addOnId: "transport-luar", price: 150 }],
      payments: [], // Belum bayar
    },
  ];

  for (const b of bookingsData) {
    const { eventTypeIds, addOns: bookingAddOns, payments, ...bookingDataWithoutRelations } = b;

    // Create or update booking
    await prisma.booking.upsert({
      where: { id: b.id },
      update: {},
      create: {
        ...bookingDataWithoutRelations,
        createdById: userId,
        // Create event type relations
        bookingEventTypes: {
          create: eventTypeIds.map((etId) => ({
            eventTypeId: etId,
          })),
        },
        // Create add-ons if provided
        ...(bookingAddOns && bookingAddOns.length > 0 && {
          bookingAddOns: {
            create: bookingAddOns.map((a) => ({
              addOnId: a.addOnId,
              price: a.price,
            })),
          },
        }),
        // Create payments if provided
        ...(payments && payments.length > 0 && {
          payments: {
            create: payments.map((p) => ({
              amount: p.amount,
              note: p.note,
              paidAt: p.paidAt,
            })),
          },
        }),
      },
    });

    console.log(`  ✅ ${b.clientName}`);
  }
  console.log("✅ Seeded", bookingsData.length, "bookings");

  console.log("\n🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
