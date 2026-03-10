/* utils/stringformat.ts */

export type Primitive = string | number | boolean | null | undefined | Date;

export interface FormatOptions {
  /**
   * When true, throws if a key is not present in data and no default is provided.
   * When false (default), leaves the original token intact.
   */
  strict?: boolean;
}

/**
 * Modifiers applied after raw value extraction (before type formatting).
 * Example: {name|upper}, {title|lower}, {word|cap}
 */
type TextModifier = "upper" | "lower" | "cap";

/**
 * Number format styles: decimal, percent, or currency.
 * Example: {price:number:currency:INR:en-IN}
 */
type NumberStyle = "decimal" | "percent" | "currency";

/**
 * Date format styles:
 * - preset 'iso' returns ISO string
 * - preset 'short'/'medium'/'long'/'full' uses Intl DateTimeFormat
 * - or provide custom Intl options via code (advanced usage, not via token)
 */
type DateStyle = "iso" | "short" | "medium" | "long" | "full";

/**
 * Utility class to format strings with named/positional placeholders,
 * modifiers, defaults, number & date formatting.
 */
export class StringFormat {
  private static TOKEN = /{{|}}|{([^{}]+)}/g; // captures content between braces; supports escaping

  /**
   * Format using a named-object or positional array of values.
   * - Named: "Hello {user.name|cap}!" with data = { user: { name: "abhilasha" } }
   * - Positional: "Hello {0}, you have {1} tasks" with array ["Abhilasha", 3]
   */
  static format<T extends Record<string, unknown>>(
    template: string,
    data: T | unknown[],
    options: FormatOptions = {}
  ): string {
    if (!template) return "";

    const isArray = Array.isArray(data);
    const strict = options.strict === true;

    return template.replace(this.TOKEN, (match, group) => {
      // Handle escaped braces
      if (match === "{{") return "{";
      if (match === "}}") return "}";

      // group contains the content like: key | default | modifier | formatter...
      const raw = String(group).trim();

      // Split by '|' once for default/modifier pipeline (first split handles default/modifiers loosely)
      // We’ll parse in two stages: default/modifiers + typed formatting.
      // Allowed syntaxes:
      // - key
      // - key|Default Value
      // - key|upper
      // - key|lower
      // - key|cap
      // - key|Default|upper   (default + modifier)
      // - key:number:currency:INR:en-IN
      // - key:number:decimal:en-US
      // - key:date:iso
      // - key:date:short:en-IN
      //
      // Strategy:
      // 1) Split by ':' to detect typed format verbs (number/date/…).
      // 2) Separately handle default/modifier through '|'.
      //
      // Because defaults can contain ':', prioritize ':' parsing first.

      // Step 1: detect typed formatter by splitting on ':'
      const colonParts = raw.split(":").map(p => p.trim());

      let beforeType = colonParts[0]; // e.g., "user.name|upper" or "price|0" etc.
      let typeVerb: string | undefined = colonParts[1]; // "number" or "date"
      const typeArgs = colonParts.slice(2); // the rest

      // Step 2: extract default/modifier(s) from beforeType with '|'
      const pipeParts = beforeType.split("|");
      const keyPath = (pipeParts[0] ?? "").trim(); // property path or index
      const pipeTail = pipeParts.slice(1); // may contain default and/or modifiers

      // Determine default value (first non-modifier pipe token)
      let defaultValue: unknown = undefined;
      // Collect text modifiers (upper/lower/cap). If a token matches modifier keywords, treat as modifier; otherwise as default (first occurrence).
      const modifiers: TextModifier[] = [];
      for (const part of pipeTail) {
        const p = part.trim();
        if (p === "upper" || p === "lower" || p === "cap") {
          modifiers.push(p);
        } else if (defaultValue === undefined && p.length > 0) {
          defaultValue = p;
        } else if (p.length > 0) {
          // If multiple non-modifier tokens, concatenate as part of default separated by '|'
          defaultValue = `${defaultValue ?? ""}${defaultValue ? "|" : ""}${p}`;
        }
      }

      // Resolve value
      let value: Primitive;

      if (isArray && /^\d+$/.test(keyPath)) {
        // Positional index for arrays
        const idx = Number(keyPath);
        const arr = data as unknown[];
        value = (arr[idx] as Primitive) ?? (defaultValue as Primitive);
      } else {
        const obj = data as Record<string, unknown>;
        value = (this.getDeep(obj, keyPath) as Primitive) ?? (defaultValue as Primitive);
      }

      if (value === undefined) {
        if (strict) {
          throw new Error(`StringFormat: key "${keyPath}" not found and no default provided in template "${template}".`);
        }
        // leave original token intact if non-strict
        return match;
      }

      // Apply modifiers (text only)
      value = this.applyModifiers(value, modifiers);

      // Apply typed formatting if any
      if (typeVerb) {
        value = this.applyTypedFormat(value, typeVerb, typeArgs);
      }

      // Convert final value to string
      return this.toString(value);
    });
  }

  /** Safe deep getter using dot notation, supports array indices: "user.address.city", "items.0.name" */
  private static getDeep(obj: Record<string, unknown>, path: string): unknown {
    if (!path) return undefined;
    const segments = path.split(".").filter(Boolean);
    let current: any = obj;
    for (const seg of segments) {
      if (current == null) return undefined;
      // numeric index access if array
      if (Array.isArray(current) && /^\d+$/.test(seg)) {
        current = current[Number(seg)];
      } else {
        current = current[seg];
      }
    }
    return current;
  }

  /** Apply simple string modifiers */
  private static applyModifiers(value: Primitive, modifiers: TextModifier[]): Primitive {
    if (value == null) return value;
    if (modifiers.length === 0) return value;

    let str = String(value);
    for (const m of modifiers) {
      switch (m) {
        case "upper":
          str = str.toUpperCase();
          break;
        case "lower":
          str = str.toLowerCase();
          break;
        case "cap":
          str = str.replace(/\b\w+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
          break;
        default:
          break;
      }
    }
    return str;
  }

  /** Typed formatter application: number/date (extensible) */
  private static applyTypedFormat(value: Primitive, typeVerb: string, args: string[]): Primitive {
    switch (typeVerb) {
      case "number":
        return this.formatNumber(value, args);
      case "date":
        return this.formatDate(value, args);
      default:
        // Unknown type -> leave as-is
        return value;
    }
  }

  /** Number formatting via Intl.NumberFormat
   * Syntax examples:
   *  - {price:number:currency:INR:en-IN}
   *  - {count:number:decimal:en-US}
   *  - {ratio:number:percent:en-US}
   */
  private static formatNumber(value: Primitive, args: string[]): Primitive {
    const style = (args[0] as NumberStyle) ?? "decimal";
    const currency = args[1]; // when style === 'currency', e.g., 'INR'
    const locale = args[style === "currency" ? 2 : 1] || undefined;

    const num = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(num)) return value;

    try {
      if (style === "currency") {
        if (!currency) return value;
        return new Intl.NumberFormat(locale, { style: "currency", currency }).format(num);
      }
      if (style === "percent") {
        return new Intl.NumberFormat(locale, { style: "percent" }).format(num);
      }
      // default decimal
      return new Intl.NumberFormat(locale, { style: "decimal" }).format(num);
    } catch {
      return value;
    }
  }
 /**
   * Replaces named placeholders in the template with values from `data`.
   * Example:
   *   StringUtil.formatNamed("Hello {name}, from {city}", { name: "Abhilasha", city: "Pune" })
   *   -> "Hello Abhilasha, from Pune"
   *
   * NOTE: Keys are matched as word characters (\w+) like {name}, {city}.
   * This simple version does NOT handle nested paths like {user.name}.
   * See the commented "getNested" and regex if you want that.
   */
  static formatNamed<T extends Record<string, unknown>>(template: string, data: T): string {
    if (!template) return "";

    return template.replace(/{(\w+)}/g, (_match, key: string) => {
      return Object.prototype.hasOwnProperty.call(data, key) && data[key] !== undefined
        ? String(data[key])
        : _match;
    });
  }

  static formatStr(template: string, ...args: (string | number | boolean | null | undefined)[]): string {
    return template.replace(/{(\d+)}/g, (match, index) => {
      const i = Number(index);
      return args[i] != null ? String(args[i]) : "";
    });
  }

  /** Date formatting via Intl.DateTimeFormat or ISO
   * Syntax examples:
   *  - {when:date:iso}
   *  - {when:date:short:en-IN}
   *  - {when:date:medium:en-US}
   *  - {when:date:long:en-GB}
   *  - {when:date:full:en-US}
   */
  private static formatDate(value: Primitive, args: string[]): Primitive {
    const preset = (args[0] as DateStyle) ?? "iso";
    const locale = args[1] || undefined;

    const date = value instanceof Date ? value : new Date(String(value));
    if (isNaN(date.getTime())) return value;

    if (preset === "iso") return date.toISOString();

    const optionsMap: Record<Exclude<DateStyle, "iso">, Intl.DateTimeFormatOptions> = {
      short: { dateStyle: "short", timeStyle: undefined },
      medium: { dateStyle: "medium", timeStyle: undefined },
      long: { dateStyle: "long", timeStyle: undefined },
      full: { dateStyle: "full", timeStyle: undefined }
    };

    const opts = optionsMap[preset as Exclude<DateStyle, "iso">] ?? { dateStyle: "medium" };
    try {
      return new Intl.DateTimeFormat(locale, opts).format(date);
    } catch {
      return value;
    }
  }

  /** Convert any primitive to string safely */
  private static toString(value: Primitive): string {
    if (value == null) return "";
    if (value instanceof Date) return value.toISOString();
    return String(value);
  }
}
// utils/stringFormat.ts

export class StringUtil {
 
  // ---------- OPTIONAL: Enable nested keys like {user.name} ----------
  // 1) Change the regex above from /{(\w+)}/g to /{([\w.]+)}/g
  // 2) Replace the return body with getNested(data, key)

  // private static getNested(obj: Record<string, unknown>, path: string): unknown {
  //   return path.split('.').reduce((acc: any, seg) => (acc == null ? undefined : acc[seg]), obj);
  // }
}