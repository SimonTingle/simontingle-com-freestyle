# 🌍 Translation System Documentation

## Overview

This is a comprehensive i18n (internationalization) system with multi-level fallbacks and failsafes. All translations are stored in JSON files in `/locales/` directory, one per language.

---

## 📁 File Structure

```
/locales/
  ├── en.json      (English - SOURCE LANGUAGE)
  ├── es.json      (Spanish)
  ├── fr.json      (French)
  ├── de.json      (German)
  ├── it.json      (Italian)
  ├── pt.json      (Portuguese)
  ├── ja.json      (Japanese)
  └── zh.json      (Chinese)

/utils/
  ├── i18n.ts      (Translation engine with fallbacks)
  └── translate.ts (Language detection & selection)

/hooks/
  └── useI18n.ts   (React hook for translations)
```

---

## 🔑 All Translation Keys

### Navigation
- `nav.home` - Home link
- `nav.projects` - Projects link
- `nav.blog` - Blog link
- `nav.contact` - Contact link

### Hero Section
- `hero.title` - Main title
- `hero.subtitle` - Subtitle

### About Section
- `about.title` - Section title
- `about.description.p1` - First paragraph
- `about.description.p2` - Second paragraph
- `about.cta.getInTouch` - Get in touch button
- `about.cta.github` - GitHub button
- `about.techStack` - Tech stack title

### Contact Section
- `contact.title` - Section title
- `contact.subtitle` - Section subtitle
- `contact.form.email` - Email label
- `contact.form.message` - Message label
- `contact.form.emailPlaceholder` - Email placeholder
- `contact.form.messagePlaceholder` - Message placeholder
- `contact.form.submit` - Submit button
- `contact.form.success` - Success message
- `contact.alternate` - Alternative contact methods text
- `contact.github` - GitHub link
- `contact.linkedin` - LinkedIn link
- `contact.email` - Email link

### Footer Section
- `footer.copyright` - Copyright text
- `footer.connect` - Connect heading
- `footer.links.github` - GitHub link
- `footer.links.linkedin` - LinkedIn link
- `footer.links.twitter` - Twitter link
- `footer.links.email` - Email link

---

## 🛡️ Fallback & Failsafe System

The translation system has **3 levels of fallbacks**:

### Level 1: Exact Language Translation
```
User language → Load JSON → Return translation
```

### Level 2: English Fallback
If a key is missing from the requested language:
```
Missing key → Load English → Return English translation
console.warn("[i18n] Missing key in {language}, using English fallback")
```

### Level 3: Key Name Fallback
If the key is missing from ALL languages:
```
Missing everywhere → Format key as text → Return formatted key
// Example: "hero.title" → "Hero Title"
console.warn("[i18n] Missing key in all languages: hero.title")
```

---

## 🚀 How to Use

### In React Components

```typescript
import { useI18n } from "@/hooks/useI18n";

export function MyComponent() {
  const { translation, language, isLoading, error } = useI18n("hero.title");

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{translation}</div>; // Falls back to key name

  return <h1>{translation}</h1>;
}
```

### Direct API Usage

```typescript
import { t } from "@/utils/i18n";

const englishText = await t("hero.title", "en");
const spanishText = await t("hero.title", "es");
```

### Language Switching

Language is managed via `languageChange` custom event:

```typescript
// User selects a language → Navigation emits this:
window.dispatchEvent(
  new CustomEvent("languageChange", { detail: { language: "es" } })
);

// All components listening to useI18n hook automatically re-render
```

---

## ✏️ Adding New Translations

### Step 1: Add Key to English JSON

```json
// /locales/en.json
{
  "footer.newLink": "New Link Text"
}
```

### Step 2: Add Same Key to All Other Languages

```json
// /locales/es.json
{
  "footer.newLink": "Texto del Nuevo Enlace"
}

// /locales/fr.json
{
  "footer.newLink": "Texte du Nouveau Lien"
}
// ... etc for all languages
```

### Step 3: Update Documentation

Add the key to this file in the appropriate section:

```markdown
### Footer Section
- `footer.newLink` - Description of the new link
```

### Step 4: Use in Component

```typescript
const { translation } = useI18n("footer.newLink");
return <a>{translation}</a>;
```

### ⚠️ CRITICAL: This is how you remember to update all JSONs!

**Checklist when adding new text:**
- [ ] Add key to `/locales/en.json` (source language)
- [ ] Copy key to `/locales/es.json` and translate
- [ ] Copy key to `/locales/fr.json` and translate
- [ ] Copy key to `/locales/de.json` and translate
- [ ] Copy key to `/locales/it.json` and translate
- [ ] Copy key to `/locales/pt.json` and translate
- [ ] Copy key to `/locales/ja.json` and translate
- [ ] Copy key to `/locales/zh.json` and translate
- [ ] Update this documentation with the key
- [ ] Use the key in your component with `useI18n()`

---

## 🔍 Validation & Debugging

### Validate a Language

```typescript
import { validateTranslations } from "@/utils/i18n";

const validation = await validateTranslations("es");
console.log(validation);
// {
//   isValid: true,
//   missingKeys: [],
//   extraKeys: []
// }
```

### Log Statistics

```typescript
import { logTranslationStats } from "@/utils/i18n";

await logTranslationStats();
// Outputs a table with translation counts per language
```

### Find Missing Keys

```typescript
import { findMissingKeys } from "@/utils/i18n";

const missing = await findMissingKeys();
console.log(missing);
// ["es: hero.subtitle", "fr: contact.form.success"]
```

### Clear Cache (Testing)

```typescript
import { clearTranslationCache } from "@/utils/i18n";

clearTranslationCache();
// Reloads all JSONs on next translation request
```

---

## 🚨 Error Handling

### JSON Load Failures

**Scenario:** Language JSON file is missing or fails to load

**What happens:**
1. ❌ Try to load requested language
2. 🔄 Fallback to English
3. ⚠️ Console warning logged
4. ✅ User sees English text (if available)

**Console output:**
```
[i18n] Error loading language "es": Failed to load language: 404
[i18n] Loaded English as fallback for "es"
```

### Missing Translation Keys

**Scenario:** A key exists in English but not in the other language

**What happens:**
1. ❌ Key not found in requested language
2. 🔄 Check English
3. ✅ Return English text
4. ⚠️ Console warning

**Console output:**
```
[i18n] Missing key "contact.newField" in "es", using English fallback
```

### Key Missing in All Languages

**Scenario:** Key doesn't exist anywhere (developer forgot to add it)

**What happens:**
1. ❌ Not in requested language
2. ❌ Not in English
3. 📝 Format key as readable text
4. ✅ Display formatted key (e.g., "Contact New Field")
5. ⚠️ Console warning

**Console output:**
```
[i18n] Missing key in all languages: "contact.newField"
```

**Result on page:** User sees `Contact New Field` (formatted key name) instead of the intended text, which immediately signals a developer error.

---

## 📊 How the System Remembers

### Automatic Failsafes

1. **TypeScript imports ensure i18n is loaded**
   - Every component using `useI18n` imports from `/hooks/useI18n.ts`
   - Can't use text without going through i18n system

2. **Warning console logs in development**
   - Missing keys logged to console
   - Developers see issues during development

3. **Validation system** (optional CI/CD integration)
   ```bash
   # Could be added to pre-commit hooks or CI:
   npm run validate-translations
   ```

4. **Visual feedback**
   - Formatted key names visible on page = missing translation
   - Easy to spot during testing

5. **Documentation (this file)**
   - Comprehensive key list
   - Checklist for adding new translations
   - Clear reminder system

---

## 🔧 Advanced: TypeScript Type Safety

(Optional enhancement for future implementation)

```typescript
// types/i18n.ts
export type TranslationKey = 
  | "hero.title"
  | "hero.subtitle"
  | "about.title"
  // ... all keys listed

// Then useI18n would be type-safe:
const { translation } = useI18n("invalid.key"); // ❌ TypeScript error!
const { translation } = useI18n("hero.title");  // ✅ OK
```

---

## 📋 Supported Languages

| Code | Language | Flag |
|------|----------|------|
| `en` | English | 🇺🇸 |
| `es` | Spanish | 🇪🇸 |
| `fr` | French | 🇫🇷 |
| `de` | German | 🇩🇪 |
| `it` | Italian | 🇮🇹 |
| `pt` | Portuguese | 🇵🇹 |
| `ja` | Japanese | 🇯🇵 |
| `zh` | Chinese | 🇨🇳 |

---

## 🎯 Summary

- ✅ **8 JSON files** = 1 per language (all language combinations covered)
- ✅ **3-level fallbacks** = Always shows something meaningful
- ✅ **Error logging** = Know when something's wrong
- ✅ **React hooks** = Easy component integration
- ✅ **Automatic detection** = Users see their language
- ✅ **Manual selection** = Language flags to switch
- ✅ **This documentation** = How to remember to update
- ✅ **Validation tools** = Find missing translations

The system is **defensive**: if anything goes wrong, it gracefully falls back and shows meaningful text or warnings.
