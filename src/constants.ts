export const SYSTEM_FONTS = [
  "Arial",
  "Arial Black",
  "Arial Rounded MT Bold",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Impact",
  "Verdana",
  "Trebuchet MS",
  "Palatino"
];

export const GOOGLE_FONTS = [
  "Roboto",
  "Roboto Condensed",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Raleway",
  "Oswald",
  "Playfair Display",
  "Anton",
  "Bebas Neue",
  "Nunito",
  "Poppins",
  "Permanent Marker",
  "Bangers",
  "Press Start 2P",
  "Dancing Script",
  "Pacifico"
];

export const ALL_FONTS = [...SYSTEM_FONTS, ...GOOGLE_FONTS];

// Single combined Google Fonts API request to prefetch and warm up cache
export const GOOGLE_FONTS_LINK = 
  "https://fonts.googleapis.com/css2?" +
  [
    "family=Roboto:wght@400;700",
    "family=Roboto+Condensed:wght@400;700",
    "family=Open+Sans:wght@400;700",
    "family=Lato:wght@400;700",
    "family=Montserrat:wght@400;700;900",
    "family=Raleway:wght@400;700",
    "family=Oswald:wght@400;700",
    "family=Playfair+Display:wght@700",
    "family=Anton",
    "family=Bebas+Neue",
    "family=Nunito:wght@700;800",
    "family=Poppins:wght@400;700",
    "family=Permanent+Marker",
    "family=Bangers",
    "family=Press+Start+2P",
    "family=Dancing+Script:wght@700",
    "family=Pacifico"
  ].join("&") +
  "&display=swap";
