// prisma/seed.ts
import { PrismaClient, EventType, BookingStatus } from "@prisma/client";
import { hashPassword } from "@better-auth/utils/password";

const prisma = new PrismaClient();

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

async function main() {
  // Seed User (Owner) using better-auth utils
  console.log("🌱 Seeding user...");
  const existingUser = await prisma.user.findUnique({
    where: { email: "riskayolan5@gmail.com" },
  });
  
  if (!existingUser) {
    // Use better-auth hashPassword (scrypt format: salt:hash)
    const hashedPassword = await hashPassword("@Takterduga1");
    const userId = generateId();
    
    await prisma.user.create({
      data: {
        id: userId,
        email: "riskayolan5@gmail.com",
        name: "Riska Yulanda Saputri",
        emailVerified: true,
      },
    });
    
    // Create account with password for better-auth
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
    // Update existing user password with better-auth hash
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
    console.log("✅ Updated user password: Riska Yulanda Saputri");
  }

  // Seed Price Packages based on price list image
  const pricePackages = [
    {
      id: "lamaran",
      name: "Lamaran",
      price: 550,
      eventTypes: [EventType.LAINNYA],
      description: "Unlimited instagram stories shoot by iphone 16 (Unedit & Edit), Unlimited video editing compilation sameday, 1-2 trend tiktok, 2-3 video recap/cinematic for reels instagram or tiktok, instagram take over (by Request), unlimited raw photo & video, file google drive",
      isActive: true,
      sortOrder: 1,
    },
    {
      id: "akad-only",
      name: "Akad Only",
      price: 550,
      eventTypes: [EventType.AKAD],
      description: "Unlimited instagram stories shoot by iphone 16 (Unedit & Edit), Unlimited video editing compilation sameday, 1-2 trend tiktok, 2-3 video recap/cinematic for reels instagram or tiktok, instagram take over (by Request), unlimited raw photo & video, file google drive",
      isActive: true,
      sortOrder: 2,
    },
    {
      id: "resepsi-only",
      name: "Resepsi Only",
      price: 650,
      eventTypes: [EventType.RESEPSI],
      description: "Unlimited instagram stories shoot by iphone 16 (Unedit & Edit), Unlimited video editing compilation sameday, 1-2 trend tiktok, 2-3 video recap/cinematic for reels instagram or tiktok, instagram take over (by Request), unlimited raw photo & video, file google drive",
      isActive: true,
      sortOrder: 3,
    },
    {
      id: "akad-resepsi-same",
      name: "Akad & Resepsi (Hari Sama)",
      price: 750,
      eventTypes: [EventType.AKAD, EventType.RESEPSI],
      description: "Unlimited instagram stories shoot by iphone 16 (Unedit & Edit), Unlimited video editing compilation sameday, 2-4 trend tiktok, Unlimited video recap/cinematic for reels instagram or tiktok, instagram take over (by Request), unlimited raw photo & video, file google drive",
      isActive: true,
      sortOrder: 4,
    },
    {
      id: "akad-resepsi-diff",
      name: "Akad & Resepsi (Beda Hari)",
      price: 1000,
      eventTypes: [EventType.AKAD, EventType.RESEPSI],
      description: "Unlimited instagram stories shoot by iphone 16 (Unedit & Edit), Unlimited video editing compilation sameday, 2-4 trend tiktok, Unlimited video recap/cinematic for reels instagram or tiktok, instagram take over (by Request), unlimited raw photo & video, file google drive",
      isActive: true,
      sortOrder: 5,
    },
    {
      id: "pengajian",
      name: "Pengajian",
      price: 400,
      eventTypes: [EventType.PENGAJIAN],
      description: "Unlimited instagram stories shoot, video editing, 1 trend tiktok, file google drive",
      isActive: true,
      sortOrder: 6,
    },
    {
      id: "tamat-kaji",
      name: "Tamat Kaji",
      price: 200,
      eventTypes: [EventType.TAMAT_KAJI],
      description: "Instagram stories shoot, video highlights, file google drive",
      isActive: true,
      sortOrder: 7,
    },
  ];

  for (const pkg of pricePackages) {
    await prisma.pricePackage.upsert({
      where: { id: pkg.id },
      update: {},
      create: pkg,
    });
  }
  console.log("✅ Seeded", pricePackages.length, "price packages");

  // Seed Add-ons
  const addOns = [
    {
      id: "stand-by-full",
      name: "Stand by dari awal - akhir acara",
      price: 0,
      description: "Dokumentasi penuh dari persiapan hingga akhir acara",
      isActive: true,
    },
    {
      id: "transport-sarolangun",
      name: "Transportasi Sarolangun",
      price: 0,
      description: "Free transport untuk area Kota Sarolangun (10km dari base)",
      isActive: true,
    },
    {
      id: "transport-luar",
      name: "Transportasi Luar Kota",
      price: 150,
      description: "Biaya tambahan transportasi untuk luar area Kota Sarolangun",
      isActive: true,
    },
    {
      id: "konsultasi-konsep",
      name: "Konsultasi Konsep",
      price: 0,
      description: "Free konsultasi konsep yang diinginkan",
      isActive: true,
    },
    {
      id: "all-file-drive",
      name: "All File via Google Drive",
      price: 0,
      description: "Semua file dikirim via Google Drive",
      isActive: true,
    },
    {
      id: "free-photo-phone",
      name: "Free Photo by Phone",
      price: 0,
      description: "Foto tambahan menggunakan handphone",
      isActive: true,
    },
    {
      id: "extra-reels",
      name: "Extra Reels/Tiktok",
      price: 50,
      description: "Tambahan 2-3 video reels/tiktok",
      isActive: true,
    },
    {
      id: "same-day-edit",
      name: "Same Day Edit Video",
      price: 100,
      description: "Video highlight yang diedit di hari yang sama",
      isActive: true,
    },
  ];

  for (const addon of addOns) {
    await prisma.addOn.upsert({
      where: { id: addon.id },
      update: {},
      create: addon,
    });
  }
  console.log("✅ Seeded", addOns.length, "add-ons");

  // Seed initial bookings with proper package + add-ons structure
  const bookings = [
    {
      clientName: "Jannah & Sahal",
      hashtag: "#SAHuntilJANNAH",
      package: 1000, // Akad & Resepsi Beda Hari (1000) + Transport Luar (150) = 1150? Actually use 1000 as base
      dp: 800,
      paid: 800,
      location: "Sungai Baung",
      eventType: [EventType.PENGAJIAN, EventType.AKAD, EventType.RESEPSI],
      startDate: new Date("2026-04-05"),
      endDate: new Date("2026-04-06"),
      status: BookingStatus.CONFIRMED,
      isConfirmed: true,
      notes: "Lunas - Paket: Akad & Resepsi Beda Hari + Transport Luar Kota",
      pricePackageId: "akad-resepsi-diff",
      addOns: [{ addOnId: "transport-luar", price: 150 }], // Extra 150 for transport
    },
    {
      clientName: "Hasni & Romadhon",
      hashtag: "#ROMAnticmomentwithHasni",
      package: 1000, // Akad & Resepsi Beda Hari
      dp: 800,
      paid: 800,
      location: "Sungai Baung",
      eventType: [EventType.PENGAJIAN, EventType.AKAD, EventType.RESEPSI],
      startDate: new Date("2026-04-19"),
      endDate: new Date("2026-04-20"),
      status: BookingStatus.CONFIRMED,
      isConfirmed: false,
      notes: "Lunas - Paket: Akad & Resepsi Beda Hari",
      pricePackageId: "akad-resepsi-diff",
      addOns: [],
    },
    {
      clientName: "Wardatul Jannah & Alvin",
      hashtag: "#WarLoVinDay",
      package: 1150, // Custom: Akad & Resepsi Beda Hari (1000) + Transport Luar (150)
      dp: 300,
      paid: 300,
      location: "Karmen",
      eventType: [EventType.AKAD, EventType.RESEPSI],
      startDate: new Date("2026-04-03"),
      endDate: new Date("2026-04-04"),
      status: BookingStatus.CONFIRMED,
      isConfirmed: true,
      notes: "Sisa 850k - Custom: Akad & Resepsi Beda Hari + Transport Luar Kota",
      pricePackageId: "akad-resepsi-diff",
      addOns: [{ addOnId: "transport-luar", price: 150 }],
    },
    {
      clientName: "Aini & Ziska",
      hashtag: "#DicintAiniZiska",
      package: 650, // Resepsi Only
      dp: 300,
      paid: 300,
      location: "Danau Serdang Pauh",
      eventType: [EventType.RESEPSI],
      startDate: new Date("2026-06-03"),
      endDate: new Date("2026-06-03"),
      status: BookingStatus.PENDING,
      isConfirmed: false,
      notes: "Resepsi Only - Free transport (masih dalam area)",
      pricePackageId: "resepsi-only",
      addOns: [{ addOnId: "transport-sarolangun", price: 0 }],
    },
    {
      clientName: "Lia & Partner",
      hashtag: null,
      package: 1000, // Akad & Resepsi Beda Hari
      dp: 300,
      paid: 300,
      location: "Panti",
      eventType: [EventType.AKAD, EventType.RESEPSI],
      startDate: new Date("2026-04-11"),
      endDate: new Date("2026-04-12"),
      status: BookingStatus.PENDING,
      isConfirmed: false,
      notes: "Paket: Akad & Resepsi Beda Hari",
      pricePackageId: "akad-resepsi-diff",
      addOns: [],
    },
    {
      clientName: "Ima & Partner",
      hashtag: null,
      package: 850, // Akad & Resepsi Hari Sama (750) + Extra Reels (50) + Same Day Edit (100) = 900, use 850 for simpler
      dp: 500,
      paid: 500,
      location: null,
      eventType: [EventType.AKAD, EventType.RESEPSI],
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-07-01"),
      status: BookingStatus.PENDING,
      isConfirmed: false,
      notes: "Paket: Akad & Resepsi Hari Sama + Extra Reels + Same Day Edit",
      pricePackageId: "akad-resepsi-same",
      addOns: [
        { addOnId: "extra-reels", price: 50 },
        { addOnId: "same-day-edit", price: 100 },
      ],
    },
    {
      clientName: "Diah & Habib",
      hashtag: null,
      package: 850, // Akad & Resepsi Hari Sama (750) + Extra Reels (50) + Same Day Edit (100)
      dp: 200,
      paid: 200,
      location: null,
      eventType: [EventType.AKAD, EventType.RESEPSI],
      startDate: new Date("2026-04-30"),
      endDate: new Date("2026-04-30"),
      status: BookingStatus.PENDING,
      isConfirmed: false,
      notes: "1 hari. Paket: Akad & Resepsi Hari Sama + Extra Reels + Same Day Edit",
      pricePackageId: "akad-resepsi-same",
      addOns: [
        { addOnId: "extra-reels", price: 50 },
        { addOnId: "same-day-edit", price: 100 },
      ],
    },
    {
      clientName: "Aci & Partner",
      hashtag: null,
      package: 1000, // Akad & Resepsi Beda Hari
      dp: 200,
      paid: 200,
      location: null,
      eventType: [EventType.AKAD, EventType.RESEPSI],
      startDate: new Date("2026-06-14"),
      endDate: new Date("2026-06-15"),
      status: BookingStatus.PENDING,
      isConfirmed: false,
      notes: "Paket: Akad & Resepsi Beda Hari",
      pricePackageId: "akad-resepsi-diff",
      addOns: [],
    },
    {
      clientName: "Tesi",
      hashtag: null,
      package: 200, // Tamat Kaji
      dp: 200,
      paid: 200,
      location: null,
      eventType: [EventType.TAMAT_KAJI],
      startDate: new Date("2026-04-26"),
      endDate: new Date("2026-04-26"),
      status: BookingStatus.PENDING,
      isConfirmed: false,
      notes: "Paket: Tamat Kaji",
      pricePackageId: "tamat-kaji",
      addOns: [],
    },
    {
      clientName: "Ilmi & Partner",
      hashtag: null,
      package: 1150, // Akad & Resepsi Beda Hari (1000) + Transport Luar (150)
      dp: 0,
      paid: 0,
      location: "Sungai Baung",
      eventType: [EventType.AKAD, EventType.RESEPSI],
      startDate: new Date("2026-04-08"),
      endDate: new Date("2026-04-09"),
      status: BookingStatus.PENDING,
      isConfirmed: false,
      notes: "Paket: Akad & Resepsi Beda Hari + Transport Luar Kota",
      pricePackageId: "akad-resepsi-diff",
      addOns: [{ addOnId: "transport-luar", price: 150 }],
    },
  ];

  for (const b of bookings) {
    const { addOns, ...bookingData } = b;
    const bookingId = b.clientName.toLowerCase().replace(/\s+/g, "-").slice(0, 20) + "-seed";
    
    await prisma.booking.upsert({
      where: { id: bookingId },
      update: {},
      create: {
        id: bookingId,
        ...bookingData,
        // Create add-ons if provided
        ...(addOns && addOns.length > 0 && {
          bookingAddOns: {
            create: addOns.map((a: { addOnId: string; price: number }) => ({
              addOnId: a.addOnId,
              price: a.price,
            })),
          },
        }),
      },
    });
  }

  console.log("✅ Seeded", bookings.length, "bookings");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
