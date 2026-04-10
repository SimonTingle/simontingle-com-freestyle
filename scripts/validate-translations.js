/**
 * Translation Validation Script
 *
 * Run this to check for missing translation keys:
 * node scripts/validate-translations.js
 */

const fs = require("fs");
const path = require("path");

const localesDir = path.join(__dirname, "../locales");

console.log("🔍 Validating translations...\n");

// Load all language files
const languages = ["en", "es", "fr", "de", "it", "pt", "ja", "zh"];
const translations: { [lang: string]: { [key: string]: string } } = {};
const errors: string[] = [];
const warnings: string[] = [];

// Load all translation files
for (const lang of languages) {
  const filepath = path.join(localesDir, `${lang}.json`);
  try {
    const content = fs.readFileSync(filepath, "utf-8");
    translations[lang] = JSON.parse(content);
    console.log(`✅ Loaded ${lang}.json (${Object.keys(translations[lang]).length} keys)`);
  } catch (error) {
    errors.push(`❌ Failed to load ${lang}.json: ${error.message}`);
  }
}

console.log("\n" + "=".repeat(50) + "\n");

// Validate: all other languages have all English keys
const englishKeys = Object.keys(translations["en"] || {});

for (const lang of languages) {
  if (lang === "en") continue;

  const langKeys = Object.keys(translations[lang] || {});
  const missingKeys = englishKeys.filter((key) => !langKeys.includes(key));
  const extraKeys = langKeys.filter((key) => !englishKeys.includes(key));

  if (missingKeys.length > 0) {
    warnings.push(`⚠️  ${lang.toUpperCase()} missing ${missingKeys.length} keys:`);
    missingKeys.forEach((key) => {
      warnings.push(`   - ${key}`);
    });
  }

  if (extraKeys.length > 0) {
    warnings.push(`⚠️  ${lang.toUpperCase()} has ${extraKeys.length} extra keys:`);
    extraKeys.forEach((key) => {
      warnings.push(`   - ${key}`);
    });
  }

  if (missingKeys.length === 0 && extraKeys.length === 0) {
    console.log(`✅ ${lang.toUpperCase()}: All keys present and valid`);
  }
}

// Print warnings
if (warnings.length > 0) {
  console.log("\n" + "=".repeat(50) + "\n");
  console.log("⚠️  WARNINGS:\n");
  warnings.forEach((warning) => console.log(warning));
}

// Print errors
if (errors.length > 0) {
  console.log("\n" + "=".repeat(50) + "\n");
  console.log("❌ ERRORS:\n");
  errors.forEach((error) => console.log(error));
}

// Summary
console.log("\n" + "=".repeat(50) + "\n");
console.log("📊 SUMMARY:\n");
console.log(`Total languages: ${languages.length}`);
console.log(`English keys: ${englishKeys.length}`);
console.log(`Total issues: ${warnings.length + errors.length}`);

if (errors.length === 0 && warnings.length === 0) {
  console.log("\n✅ All translations are valid!\n");
  process.exit(0);
} else {
  console.log("\n⚠️  Please fix the issues above\n");
  process.exit(1);
}
