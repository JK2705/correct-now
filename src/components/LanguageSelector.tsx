import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTooltip?: boolean;
  highlight?: boolean;
}

export const LANGUAGE_OPTIONS = [
  { code: "auto", name: "Any language (Common)" },
  // Global / Most Widely Used
  { code: "en", name: "English" },
  { code: "zh", name: "Chinese Mandarin (中文)" },
  { code: "hi", name: "Hindi (हिन्दी)" },
  { code: "es", name: "Spanish (Español)" },
  { code: "fr", name: "French (Français)" },
  { code: "ar", name: "Arabic (العربية)" },
  { code: "bn", name: "Bengali (বাংলা)" },
  { code: "pt", name: "Portuguese (Português)" },
  { code: "ru", name: "Russian (Русский)" },
  { code: "ur", name: "Urdu (اردو)" },
  { code: "id", name: "Indonesian (Bahasa Indonesia)" },
  { code: "de", name: "German (Deutsch)" },
  { code: "ja", name: "Japanese (日本語)" },
  { code: "sw", name: "Swahili (Kiswahili)" },
  { code: "mr", name: "Marathi (मराठी)" },
  { code: "te", name: "Telugu (తెలుగు)" },
  { code: "tr", name: "Turkish (Türkçe)" },
  { code: "ta", name: "Tamil (தமிழ்)" },
  { code: "vi", name: "Vietnamese (Tiếng Việt)" },
  { code: "ko", name: "Korean (한국어)" },
  { code: "it", name: "Italian (Italiano)" },

  // Indian Languages - Constitutionally Recognized (22)
  { code: "kn", name: "Kannada (ಕನ್ನಡ)" },
  { code: "ml", name: "Malayalam (മലയാളം)" },
  { code: "gu", name: "Gujarati (ગુજરાતી)" },
  { code: "pa", name: "Punjabi (ਪੰਜਾਬੀ)" },
  { code: "or", name: "Odia (ଓଡ଼ିଆ)" },
  { code: "as", name: "Assamese (অসমীয়া)" },
  { code: "sa", name: "Sanskrit (संस्कृतम्)" },
  { code: "ne", name: "Nepali (नेपाली)" },
  { code: "kok", name: "Konkani (कोंकणी)" },
  { code: "mni", name: "Manipuri (ꯃꯩꯇꯩꯂꯣꯟ)" },
  { code: "brx", name: "Bodo (बड़ो)" },
  { code: "doi", name: "Dogri (डोगरी)" },
  { code: "mai", name: "Maithili (मैथिली)" },
  { code: "sat", name: "Santhali (ᱥᱟᱱᱛᱟᱲᱤ)" },
  { code: "ks", name: "Kashmiri (کٲشُر)" },
  { code: "sd", name: "Sindhi (سنڌي)" },

  // Other Widely Spoken Indian Languages
  { code: "tcy", name: "Tulu (ತುಳು)" },
  { code: "kfa", name: "Kodava (ಕೊಡವ)" },
  { code: "bho", name: "Bhojpuri (भोजपुरी)" },
  { code: "mag", name: "Magahi (मगही)" },
  { code: "hne", name: "Chhattisgarhi (छत्तीसगढ़ी)" },
  { code: "raj", name: "Rajasthani (राजस्थानी)" },
  { code: "bgc", name: "Haryanvi (हरियाणवी)" },
  { code: "awa", name: "Awadhi (अवधी)" },
  { code: "gbm", name: "Garhwali (गढ़वळि)" },
  { code: "kfy", name: "Kumaoni (कुमाऊँनी)" },
  { code: "bhb", name: "Bhili (भीली)" },
  { code: "gon", name: "Gondi (गोंडी)" },
  { code: "lus", name: "Mizo (Lushai) (Mizo ṭawng)" },
  { code: "kha", name: "Khasi (Ka Ktien Khasi)" },
  { code: "grt", name: "Garo (Mandi)" },

  // European Languages
  { code: "nl", name: "Dutch (Nederlands)" },
  { code: "sv", name: "Swedish (Svenska)" },
  { code: "no", name: "Norwegian (Norsk)" },
  { code: "da", name: "Danish (Dansk)" },
  { code: "fi", name: "Finnish (Suomi)" },
  { code: "is", name: "Icelandic (Íslenska)" },
  { code: "ga", name: "Irish (Gaeilge)" },
  { code: "cy", name: "Welsh (Cymraeg)" },
  { code: "gd", name: "Scottish Gaelic (Gàidhlig)" },
  { code: "pl", name: "Polish (Polski)" },
  { code: "cs", name: "Czech (Čeština)" },
  { code: "sk", name: "Slovak (Slovenčina)" },
  { code: "hu", name: "Hungarian (Magyar)" },
  { code: "ro", name: "Romanian (Română)" },
  { code: "bg", name: "Bulgarian (Български)" },
  { code: "el", name: "Greek (Ελληνικά)" },
  { code: "sq", name: "Albanian (Shqip)" },
  { code: "sr", name: "Serbian (Српски)" },
  { code: "hr", name: "Croatian (Hrvatski)" },
  { code: "bs", name: "Bosnian (Bosanski)" },
  { code: "sl", name: "Slovenian (Slovenščina)" },
  { code: "uk", name: "Ukrainian (Українська)" },
  { code: "be", name: "Belarusian (Беларуская)" },
  { code: "lv", name: "Latvian (Latviešu)" },
  { code: "lt", name: "Lithuanian (Lietuvių)" },
  { code: "et", name: "Estonian (Eesti)" },
  { code: "mt", name: "Maltese (Malti)" },
  { code: "eu", name: "Basque (Euskara)" },
  { code: "ca", name: "Catalan (Català)" },
  { code: "gl", name: "Galician (Galego)" },

  // Middle Eastern & Central Asian Languages
  { code: "he", name: "Hebrew (עברית)" },
  { code: "fa", name: "Persian (فارسی)" },
  { code: "ps", name: "Pashto (پښتو)" },
  { code: "ku", name: "Kurdish (Kurdî)" },
  { code: "prs", name: "Dari (دری)" },
  { code: "uz", name: "Uzbek (Oʻzbek)" },
  { code: "kk", name: "Kazakh (Қазақ)" },
  { code: "tk", name: "Turkmen (Türkmen)" },
  { code: "az", name: "Azerbaijani (Azərbaycan)" },
  { code: "tg", name: "Tajik (Тоҷикӣ)" },

  // African Languages
  { code: "am", name: "Amharic (አማርኛ)" },
  { code: "om", name: "Oromo (Afaan Oromoo)" },
  { code: "ti", name: "Tigrinya (ትግርኛ)" },
  { code: "ha", name: "Hausa" },
  { code: "yo", name: "Yoruba (Yorùbá)" },
  { code: "ig", name: "Igbo" },
  { code: "zu", name: "Zulu (isiZulu)" },
  { code: "xh", name: "Xhosa (isiXhosa)" },
  { code: "af", name: "Afrikaans" },
  { code: "so", name: "Somali (Soomaali)" },
  { code: "ber", name: "Berber (Tamazight) (ⵜⴰⵎⴰⵣⵉⵖⵜ)" },
  { code: "sn", name: "Shona (chiShona)" },
  { code: "st", name: "Sesotho" },
  { code: "tn", name: "Tswana (Setswana)" },

  // East & Southeast Asian Languages
  { code: "yue", name: "Chinese Cantonese (粵語)" },
  { code: "th", name: "Thai (ไทย)" },
  { code: "km", name: "Khmer (ភាសាខ្មែរ)" },
  { code: "lo", name: "Lao (ລາວ)" },
  { code: "my", name: "Burmese (မြန်မာ)" },
  { code: "ms", name: "Malay (Bahasa Melayu)" },
  { code: "jw", name: "Javanese (Basa Jawa)" },
  { code: "su", name: "Sundanese (Basa Sunda)" },
  { code: "mn", name: "Mongolian (Монгол)" },
  { code: "bo", name: "Tibetan (བོད་སྐད)" },

  // Indigenous & Regional Languages
  { code: "nv", name: "Navajo (Diné bizaad)" },
  { code: "qu", name: "Quechua (Runa Simi)" },
  { code: "ay", name: "Aymara" },
  { code: "gn", name: "Guarani (Avañe'ẽ)" },
  { code: "mi", name: "Māori (Te Reo Māori)" },
  { code: "sm", name: "Samoan" },
  { code: "to", name: "Tongan (Lea Faka-Tonga)" },
  { code: "haw", name: "Hawaiian (ʻŌlelo Hawaiʻi)" },
  { code: "iu", name: "Inuktitut (ᐃᓄᒃᑎᑐᑦ)" },
  { code: "ypk", name: "Yupik" },

  // Additional Languages
  { code: "tl", name: "Tagalog (Filipino)" },
  { code: "hy", name: "Armenian (Հայերեն)" },
  { code: "ka", name: "Georgian (ქართული)" },
  { code: "ky", name: "Kyrgyz (Кыргызча)" },
  { code: "si", name: "Sinhala (සිංහල)" },
  { code: "fy", name: "Frisian (Frysk)" },
  { code: "yi", name: "Yiddish (ייִדיש)" },
  { code: "la", name: "Latin (Latina)" },
  { code: "eo", name: "Esperanto" },
  { code: "lb", name: "Luxembourgish (Lëtzebuergesch)" },
  { code: "mk", name: "Macedonian (Македонски)" },
  { code: "mg", name: "Malagasy" },
  { code: "tt", name: "Tatar (Татарча)" },
  { code: "ceb", name: "Cebuano" },
  { code: "ny", name: "Chichewa (Nyanja)" },
  { code: "co", name: "Corsican (Corsu)" },
  { code: "ht", name: "Haitian Creole (Kreyòl)" },
  { code: "hmn", name: "Hmong" },
];

const LanguageSelector = ({ value, onChange, open, onOpenChange, showTooltip = false, highlight = false }: LanguageSelectorProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = open ?? internalOpen;
  const uniqueLanguages = Array.from(new Map(LANGUAGE_OPTIONS.map((lang) => [lang.code, lang])).values());
  const selectedLanguage = uniqueLanguages.find((lang) => lang.code === value);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    handleOpenChange(false);
  };

  const selector = (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className={cn(
            "w-full sm:w-[180px] justify-between bg-card",
            highlight ? "blink-green-slow" : ""
          )}
        >
          <span className="truncate">
            {selectedLanguage ? selectedLanguage.name : "Select language"}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[calc(100vw-2rem)] sm:w-[280px] p-0 max-h-[70vh]"
        align="center"
        side="bottom"
        sideOffset={8}
        avoidCollisions={false}
      >
        <Command>
          <CommandInput placeholder="Type to search..." autoFocus />
          <CommandList className="max-h-[55vh] overflow-y-auto">
            <CommandEmpty>No languages found.</CommandEmpty>
            <CommandGroup>
              {uniqueLanguages.map((lang) => (
                <CommandItem
                  key={lang.code}
                  value={`${lang.name} ${lang.code}`}
                  onSelect={() => handleSelect(lang.code)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === lang.code ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {lang.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  // Show tooltip when language is not selected and user should select one
  if (showTooltip && !value) {
    return (
      <TooltipProvider>
        <Tooltip open={showTooltip}>
          <TooltipTrigger asChild>
            {selector}
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-accent text-accent-foreground">
            <p className="font-medium">Please select a language first</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return selector;
};

export default LanguageSelector;
