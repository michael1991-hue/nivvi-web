# Nivvi OEM / private-label wearable
## Bluetooth heart-rate + SpO₂ specification (RFQ)

**Buyer:** Nivvi (UK) — iOS app bundle ID `com.michael1991.nivvi`  
**Use:** Wellness / fitness display on iPhone. **Not a medical device.**  
**Target factory:** Shenzhen / Dongguan OEM of BLE PPG wrist (or sock) modules  
**Date:** 15 September 2026  
**Revision:** 1.0

Samples will be paired to the live Nivvi iOS app and to **nRF Connect**.  
A unit that only works with a vendor Android APK will be rejected.

---

## 1. Goal

Supply a Nivvi-branded wearable whose radio already talks the **same BLE language** as the customer’s working Neebo-style bracelet, **and** also speaks standard Bluetooth Heart Rate so a locked iPhone can keep receiving data.

Two streams, same BPM / SpO₂:

| Stream | Why |
|---|---|
| **A — Custom `FFE0` 9-byte** | Matches the protocol Nivvi already decodes on the current wearable |
| **B — Standard `180D` / `1822` notify** | Required for iOS background / lock screen |

If you cannot do **A**, do not quote. If you cannot do **B**, say so clearly (overnight use will be weaker).

Do **not** copy Neebo / BabySensor names, logos, packaging or charging-dock design.

---

## 2. Bluetooth (mandatory)

- Bluetooth **Low Energy 5.0+** (not Classic, not BR/EDR-only)
- Peripheral / GATT server
- Connectable advertising while worn
- **One** central at a time (iPhone Core Bluetooth)
- Re-advertise within **3 seconds** after disconnect or out-of-range
- Pairing: **Just Works** (no PIN). Bonding optional; must reconnect by identity
- PHY: 1M LE. 2M optional
- TX power: typical wearable, stable inside ~8–10 m line of sight
- Do **not** require your own app to stay open
- Do **not** lock GATT behind a vendor handshake Nivvi does not have

Advertised name (examples): `Nivvi` or `Nivvi HR` (≤ 18 characters).

---

## 3. Stream A — custom service (must match Nivvi)

This is the protocol Nivvi already maps as its experimental custom adapter.

### 3.1 GATT

| UUID | Role |
|---|---|
| Service **`0xFFE0`** | Primary |
| Characteristic **`0xFFE7`** | Measurement stream (**required**) |
| Characteristic **`0xFFEA`** | Status (optional, 2 bytes) |
| Characteristic **`0xFFE4`** | Status (optional) |

`FFE7` properties: **Notify required**. Read allowed. Write not required.

CCC descriptor `0x2902` must enable notify from iOS `setNotifyValue(true)`.

### 3.2 Measurement frame (`FFE7`) — exactly 9 bytes

Little-endian raw bytes. No encryption.

| Offset | Size | Value | Meaning |
|---|---|---|---|
| 0 | 1 | `0x00` | Fixed |
| 1 | 1 | `0x00` | Fixed |
| 2 | 1 | `0x00` | Fixed |
| 3 | 1 | `30–240` | Heart rate (bpm) |
| 4 | 1 | `0x00` | High byte of HR must be 0 |
| 5 | 1 | `70–100` | SpO₂ (%) |
| 6 | 1 | `0x00` | High byte of SpO₂ must be 0 |
| 7 | 1 | vendor | Ignored by Nivvi today |
| 8 | 1 | vendor | Ignored by Nivvi today |

**Reject** frames that are not 9 bytes, or that have non-zero bytes 0–2, 4 or 6.

Example (112 bpm, 97% SpO₂):

```
00 00 00 70 00 61 00 00 00
```

`0x70` = 112, `0x61` = 97.

Notify period: **1 second** preferred (range 0.5–2 s) while worn with a valid PPG lock.  
If contact is lost: either stop notify or send no valid HR (do not repeat the last BPM for minutes).

### 3.3 Status `FFEA` (optional)

If present, 2-byte little-endian counter is shown in Nivvi diagnostics only  
(possible session minutes). Not used as heart rate.

---

## 4. Stream B — standard Bluetooth (strongly required)

### 4.1 Heart Rate Service (SIG)

| UUID | Role |
|---|---|
| Service **`0x180D`** | Heart Rate |
| Characteristic **`0x2A37`** | Heart Rate Measurement — **Notify required** |

Follow the Bluetooth SIG Heart Rate Profile:

- Flags byte + 8-bit or 16-bit BPM  
- If a contact sensor exists, set the contact bits correctly  
- **Sensor contact = none** must not report a live BPM  
- Same BPM as Stream A, same second  

Example 8-bit, 112 bpm, contact detected: `06 70`  
(flags `0x06` = 8-bit + contact supported + contact detected; `0x70` = 112)

### 4.2 Pulse Oximeter Service (SIG) — required if you advertise SpO₂

| UUID | Role |
|---|---|
| Service **`0x1822`** | Pulse Oximeter |
| Characteristic **`0x2A5F`** | PLX Continuous Measurement — **Notify required** |
| Optional `0x2A5E` | Spot-check (event only in Nivvi; does **not** drive live alarms) |

IEEE 11073 SFLOAT oxygen 0–100% and pulse 1–65535.  
Do not send demo / test / calibration flags on live packets.

### 4.3 Battery

| UUID | Role |
|---|---|
| Service **`0x180F`** | Battery |
| Characteristic **`0x2A19`** | Battery Level 0–100, Read + Notify |

---

## 5. Advertising

Advertise **at least** one of:

- Service UUID `180D`
- Service UUID `1822`
- Service UUID `FFE0`

so Nivvi’s scan can find the device without “show all devices”.

Preferred: advertise **`180D` and `FFE0`**.

Interval ~100–300 ms while connectable.

---

## 6. iOS behaviour (acceptance tests)

Factory must pass all of these on an iPhone (iOS 16 or later) **without** any vendor app:

1. **nRF Connect:** services `FFE0` and `180D` visible. Enable notify on `FFE7` and `2A37`. Frames match §3.2 and §4.1.
2. **Nivvi:** Device → Scan → device listed → Connect.
3. Profile may show as mapped/custom and/or standard heart-rate. Live BPM appears within 10 s.
4. SpO₂ appears if Stream A byte 5 or `1822` is implemented.
5. **Lock the iPhone for 10 minutes.** `2A37` notify must still arrive (Stream B). Stream A alone is **not** enough to pass this test.
6. Walk out of range until Nivvi shows connection lost; walk back. Auto-reconnect without pairing again.
7. Charge to 20%, confirm `2A19` battery %.
8. Two iOS apps may not share BLE; Nivvi only. Do not require another app for the stream.

Fail any of 1–6 = no bulk order.

---

## 7. Hardware

**First product (preferred):** adult / child wrist band  
- PPG HR + SpO₂  
- Silicone strap 12–22 mm, or 20 mm quick-release  
- Dark teal / black housing  
- Magnetic or USB-C charge  
- Battery **≥ 3 days** typical HR+SpO₂ every 1 s; **≥ 7 days** if 5 s interval offered as a mode  
- IP67 minimum (IP68 preferred)  
- Weight < 25 g (band)  
- Skin-contact: medical-grade / food-grade silicone, REACH, RoHS, nickel-safe buckle  
- Operating 0–40 °C; storage −10–45 °C  

**Optional second SKU (quote separately):** infant sock / foot PPG.  
**Do not market as a medical / SIDS / baby-monitor device.** Quote only as wellness hardware. Regulatory for infant claims is out of scope of this RFQ.

---

## 8. Firmware

- Unique public BLE address per unit  
- Firmware version readable (manufacturer string `0x2A29` / firmware `0x2A26` preferred)  
- Factory reset: hold button 10 s or charge-pin sequence  
- No forced pairing PIN  
- No cloud account required for GATT  
- OTA optional; if present, must not brick units in the field without a documented recovery  
- Measurement interval configurable only if default remains ≤ 2 s  

---

## 9. Branding & pack (UK English)

- Laser or pad print **NIVVI** on the housing (artwork supplied as SVG/PNG)  
- Colour: black + teal accent (Pantone to follow on sample sign-off)  
- Box: Nivvi logo, “Bluetooth heart-rate wearable”, **“Not a medical device”**  
- Contents: wearable, charger, UK/EU plug if needed, 1-page English quick start  
- Quick start steps: charge → wear snug → open Nivvi → Device → Scan → Connect  
- No factory brand on the housing. Inner PCB marking OK  
- Manual must **not** say diagnose, treat, SIDS, clinical, hospital, or “medical monitor”

---

## 10. Compliance (ship to United Kingdom)

Minimum for bulk:

- CE (RED 2014/53/EU) **and** UKCA (or CE + UK importer label)
- RoHS, REACH
- Battery: UN38.3, MSDS; IEC 62133 if applicable
- RF: BLE test report
- Skin: biocompatibility statement for silicone (ISO 10993-5/-10 preferred)

**Not requested in this RFQ:** MDR / UKCA medical, FDA 510(k), IEC 80601 pulse-oximeter clinical accuracy.  
If you already hold those, list them as **optional extras** only.

Buyer is UK importer. Pack must allow an importer name and UK address.

---

## 11. What to send with the quote

1. Datasheet of the **exact module** (PPG + BLE SoC)
2. GATT table (screenshot or Excel)
3. Raw capture: 10 seconds of `FFE7` notifies (hex)
4. Sample price, sample lead time (target ≤ 14 days), qty 2–5
5. Unit FOB Shenzhen for **100 / 500 / 1000 / 5000**
6. Logo + box setup fee and MOQ
7. Production lead time after deposit
8. Which of Stream A / Stream B you already ship on a stock mould
9. Photos of existing similar SKU (no competitor brand in shot)

---

## 12. Commercial (buyer terms)

- Samples first, **paid**, credited against first bulk order  
- Bulk: 30% deposit, 70% after photos / AQL of the finished lot (Trade Assurance preferred)  
- AQL: major 1.5, minor 4.0; 100% power-on + BLE name check  
- Firmware freeze after Nivvi sample sign-off; no silent protocol change  
- Nivvi owns brand artwork. Factory does not sell Nivvi-branded leftovers  
- Protocol in §3 is for **interoperability with our app**, not a licence to use anyone else’s trademarks  

---

## 13. Contact / questions factories always ask

| Question | Answer |
|---|---|
| Do you need your Android app? | No. iOS Nivvi only for this RFQ |
| SDK? | Not if GATT above is implemented |
| Can we use a different 9-byte layout? | No. Bytes 0–6 must match §3.2 |
| Heart rate only, no SpO₂? | Acceptable as SKU-1 if Stream B `180D` is present |
| Apple Watch / HealthKit? | Out of scope |
| Two phones at once? | Not required |
| Medical accuracy ±2% SpO₂? | Not claimed. Wellness grade |

---

## 14. Short Alibaba first message

```
Hello, we need OEM BLE PPG wristband for our iOS app (Nivvi, UK).

Must have BOTH:
1) Custom service 0xFFE0, notify 0xFFE7, exactly 9-byte frame:
   00 00 00 [HR] 00 [SpO2] 00 xx xx
   HR 30-240, SpO2 70-100
2) Standard Heart Rate 0x180D / 0x2A37 NOTIFY (same BPM)
   Optional 0x1822 / 0x2A5F for SpO2
   Battery 0x180F / 0x2A19

No vendor app. We will test with nRF Connect + our app on iPhone.
Please send: module datasheet, GATT table, sample price for 2pcs,
FOB 500/1000, logo MOQ, lead time.

This is wellness, not medical. Brand: NIVVI.
```

---

*End of specification — Rev 1.0*
