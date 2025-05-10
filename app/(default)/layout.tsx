import type { Metadata } from "next";
import "./globals.css";

import { bold } from "@/client";
import type { Settings } from "@boldvideo/bold-js";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Header } from "@/components/header";
import { SettingsProvider } from "@/components/providers/settings-provider";

// Extend the Settings type to include additional properties
interface ExtendedSettings extends Settings {
  theme_config?: {
    radius: string;
    light: {
      background: string;
      foreground: string;
      card: string;
      popover: string;
      card_foreground: string;
      popover_foreground: string;
      primary: string;
      primary_foreground: string;
      secondary: string;
      secondary_foreground: string;
      muted: string;
      muted_foreground: string;
      accent: string;
      accent_foreground: string;
      destructive: string;
      border: string;
      input: string;
      ring: string;
      sidebar: string;
      sidebar_foreground: string;
      sidebar_primary: string;
      sidebar_primary_foreground: string;
      sidebar_accent: string;
      sidebar_accent_foreground: string;
      sidebar_border: string;
      sidebar_ring: string;
    };
    dark: {
      background: string;
      foreground: string;
      card: string;
      card_foreground: string;
      popover: string;
      popover_foreground: string;
      primary: string;
      primary_foreground: string;
      secondary: string;
      secondary_foreground: string;
      muted: string;
      muted_foreground: string;
      accent: string;
      accent_foreground: string;
      destructive: string;
      border: string;
      input: string;
      ring: string;
      sidebar: string;
      sidebar_foreground: string;
      sidebar_primary: string;
      sidebar_primary_foreground: string;
      sidebar_accent: string;
      sidebar_accent_foreground: string;
      sidebar_border: string;
      sidebar_ring: string;
    };
  };
  logo_url?: string;
  logo_dark_url?: string;
  favicon_url?: string;
  // Extend the nested meta_data object
  meta_data: Settings["meta_data"] & {
    social_graph_image_url?: string;
  };
}

// Default metadata values
const defaultMetadata = {
  title: "The Misfits - A Design & Strategy Studio That UnF*cks Brands.",
  description:
    "We’re a team of badass designers and brand strategists ridding the world of f*cked up brands.  You only get one chance to make a first impression.",
  ogImage: "https://the-misfits.bold.video/og-static.png",
  siteUrl: "https://the-misfits.bold.video",
};

export async function generateMetadata(): Promise<Metadata> {
  let settings = {} as ExtendedSettings;

  try {
    const settingsResponse = await bold.settings();
    settings = settingsResponse.data as ExtendedSettings;
  } catch (error) {
    console.error("Failed to fetch settings for metadata:", error);
    // Use default metadata if fetch fails
    return {
      title: defaultMetadata.title,
      description: defaultMetadata.description,
      openGraph: {
        title: defaultMetadata.title,
        description: defaultMetadata.description,
        url: defaultMetadata.siteUrl,
        siteName: defaultMetadata.title,
        images: [
          {
            url: defaultMetadata.ogImage,
            width: 1200,
            height: 630,
          },
        ],
        locale: "en-US",
        type: "website",
      },
    };
  }

  const meta = settings.meta_data;
  const title = meta?.title
    ? `${meta.title}${meta.title_suffix || ""}`
    : defaultMetadata.title;
  const description = meta?.description || defaultMetadata.description;
  const ogImageUrl =
    meta?.social_graph_image_url || meta?.image || defaultMetadata.ogImage;

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      url: defaultMetadata.siteUrl, // Assuming site URL is constant for now
      siteName: title,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
        },
      ],
      locale: "en-US",
      type: "website",
    },
    // Add dynamic icons
    icons: {
      icon: settings.favicon_url || "/favicon.ico", // Use fetched url or default
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize with a type assertion that handles all required fields from the base Settings type
  // Settings are fetched here again for theme/layout purposes, separate from metadata generation.
  let settings = {} as ExtendedSettings;
  settings.menu_items = []; // Ensure menu_items is initialized

  try {
    const settingsResponse = await bold.settings();
    settings = settingsResponse.data as ExtendedSettings;
    // Ensure meta_data is initialized if it comes back null/undefined but expected
    if (!settings.meta_data) {
      settings.meta_data = {} as ExtendedSettings["meta_data"];
    }
  } catch (error) {
    console.error("Failed to fetch settings for layout:", error);
    // Initialize meta_data in case of error too
    settings.meta_data = {} as ExtendedSettings["meta_data"];
  }

  console.log("settings", settings);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon is now handled by generateMetadata */}
        {/* {settings.favicon_url && (
          <link rel="icon" href={settings.favicon_url} sizes="any" />
        )} */}
        <link
          rel="stylesheet"
          href="https://use.typekit.net/jpg4nwn.css"
        ></link>
      </head>
      <body className="bg-background flex flex-col h-screen lg:h-auto min-h-screen">
        <SettingsProvider settings={settings}>
          <Header
            logo={settings.logo_url || "/bold-logo.svg"}
            logoDark={settings.logo_dark_url}
            menuItems={settings.menu_items || []}
          />
          <main className="flex-1 min-h-0 flex flex-col">{children}</main>
        </SettingsProvider>
      </body>
    </html>
  );
}
