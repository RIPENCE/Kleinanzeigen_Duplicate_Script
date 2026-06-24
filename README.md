# 📋 Kleinanzeigen – Anzeige duplizieren / neu einstellen

> Ein Userscript das beim Bearbeiten einer Anzeige auf [kleinanzeigen.de](https://www.kleinanzeigen.de) zwei zusätzliche Buttons hinzufügt: **Duplizieren** und **Neu einstellen**.

![Version](https://img.shields.io/badge/version-3.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Tampermonkey%20%7C%20Violentmonkey-orange)

---

## ✨ Features

| Funktion | Beschreibung |
|---|---|
| 📋 **Duplizieren** | Erstellt eine neue Kopie der Anzeige mit allen Daten (Titel, Beschreibung, Bilder, Kategorie, Preis usw.) |
| 🔄 **Neu einstellen** | Löscht die alte Anzeige und stellt sie als neue ein – ideal um die Anzeige wieder nach oben zu bringen |

---

## 📸 Screenshot

Die beiden Buttons erscheinen direkt neben dem **„Anzeige speichern"**-Button:

> `Vorschau` · `Anzeige speichern` · `📋 Duplizieren` · `🔄 Neu einstellen`

---

## 🚀 Installation

### Voraussetzungen

Du benötigst einen Userscript-Manager im Browser:

- [Tampermonkey](https://www.tampermonkey.net/) *(empfohlen)*
- [Violentmonkey](https://violentmonkey.github.io/)

### Installation

1. Userscript-Manager installieren (falls noch nicht vorhanden)
2. Auf den folgenden Link klicken – der Manager erkennt das Skript automatisch:

   **[➡️ Skript installieren](../../raw/main/kleinanzeigen-duplizieren.user.js)**

3. Im erscheinenden Dialog auf **„Installieren"** klicken
4. Fertig ✅

---

## 🔧 Verwendung

1. Auf [kleinanzeigen.de](https://www.kleinanzeigen.de) einloggen
2. Eine eigene Anzeige öffnen und auf **„Bearbeiten"** klicken
3. Die zwei neuen Buttons erscheinen neben „Anzeige speichern"

### 📋 Duplizieren

- Klick auf **„📋 Duplizieren"**
- Das Skript schickt alle Formulardaten als neue Anzeige ab
- Nach dem Speichern wird automatisch weitergeleitet

### 🔄 Neu einstellen

- Klick auf **„🔄 Neu einstellen"**
- Bestätigungsdialog erscheint
- Die alte Anzeige wird gelöscht, dann als neue Anzeige eingestellt
- Nützlich wenn die Anzeige wieder ganz oben erscheinen soll, ohne extra Kosten

---

## 🌐 Kompatibilität

| Browser | Status |
|---|---|
| Chrome + Tampermonkey | ✅ |
| Edge + Tampermonkey | ✅ |
| Firefox + Tampermonkey | ✅ |
| Firefox + Violentmonkey | ✅ |

---

## ⚙️ Technische Details

Die neue Kleinanzeigen-Seite (seit 2025) ist eine vollständige **React-SPA**. Das Skript arbeitet daher nicht mehr mit dem klassischen Formular-Submit, sondern spricht die internen APIs direkt an:

- **Submit:** `POST https://www.kleinanzeigen.de/_actions/postListingWeb.submitListing/`  
  Als `multipart/form-data` mit CSRF-Token aus dem Hidden-Input
- **Delete:** `DELETE https://gateway.kleinanzeigen.de/ad-service/ads/{adId}`  
  Mit Bearer-Token aus dem Session-Cookie
- **Modal-Handling:** Upsell-Popups werden automatisch per `MutationObserver` weggeklickt

---

## 📋 Changelog

### v3.1.0
- CSRF-Token wird jetzt aus dem Hidden-Input `input[name="_csrf"]` gelesen
- Delete-Funktion nutzt die neue Gateway-API mit Bearer-Token
- Formulardaten werden direkt per API-Call übermittelt (kein React-Button-Click mehr)

### v3.0.0
- Komplette Neuentwicklung für die neue React-basierte Kleinanzeigen-Seite
- Direkter API-Call statt DOM-Manipulation
- Automatisches Wegklicken von Upsell-Modals

### v2.x
- MutationObserver für dynamisches DOM-Laden
- Upsell-Modal-Handling

### v1.4.0
- Ursprüngliche Version (klassische HTML-Seite)

---

## ⚠️ Hinweise

- Das Skript funktioniert nur wenn du **eingeloggt** bist
- **„Neu einstellen"** löscht die ursprüngliche Anzeige unwiderruflich
- Kleinanzeigen kann jederzeit ihre API ändern – bei Problemen bitte ein [Issue](../../issues) öffnen
- Dieses Skript ist kein offizielles Produkt von Kleinanzeigen

---

## 📄 Lizenz

MIT License – siehe [LICENSE](LICENSE)

---

## 🙏 Credits

Ursprünglich entwickelt von [J05HI](https://github.com/J05HI).  
Für die neue React-Seite komplett überarbeitet.
