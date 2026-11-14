# خطوة بلان · Khatwa Plan 📐

> تطبيق هندسي احترافي لرسم المخططات المعمارية خطوة بخطوة وتصديرها مباشرة إلى برامج الأوتوكاد (DXF)  
> *A professional engineering floor-plan sketching tool, exportable directly to AutoCAD (DXF) and CAD systems.*

---

## ✨ المميزات الرئيسية · Key Features

- **الدقة الهندسية (Engineering Precision)**: رسم الحوائط بالسنتيمتر مع دعم الأرقام العشرية (مثل `125.5` أو `125.25`).
- **إضافة الفتحات المباشرة (Doors & Windows)**: رسم الأبواب (مع أقواس الفتح الهندسية) والشبابيك مباشرة على المسار، واستكمال الرسم من نهايتها.
- **تصدير DXF احترافي (AutoCAD DXF Export)**: ملفات DXF متوافقة مع AutoCAD وRevit بطبقات منفصلة (`WALL` للحوائط، `DOOR` للأبواب، `WINDOW` للشبابيك) ومقاسات مكتوبة وأقواس هندسية.
- **حفظ سحابي وسجل مخططات (Cloud Save & History)**: حفظ المخططات السحابية عبر Firebase Firestore مع تاريخ ووقت الحفظ وإحصائيات الحوائط والفتحات.
- **إمكانية التحديث أو حفظ كنسخة (Update Existing or Save As New)**: عند العمل على مخطط سابق، يمكنك تحديث المخطط الأصلي أو حفظه كنسخة جديدة.
- **وضع الزائر (Guest Mode)**: استخدام فوري وسريع للأداة دون الحاجة لتسجيل حساب، مع إمكانية الترقية وحفظ المخططات لاحقاً.
- **ثنائي اللغة بالكامل (Bilingual AR / EN)**: واجهة عربية أصيلة (RTL) مع إمكانية التبديل الفوري للإنجليزية (LTR).
- **تصميم متجاوب بالكامل مع الموبايل (Mobile-First & Touch Ready)**: تجربة استخدام مريحة على الهواتف والأجهزة اللوحية (الوضع الرأسي والأفقي) مع دعم اللمس، السحب، والتقريب بإصبعين (Pinch to zoom).

---

## 🛠️ التقنيات المستخدمة · Tech Stack

- **Framework**: Svelte 5 (Runes)
- **Language**: TypeScript 6 (Strict Mode)
- **Bundler**: Vite 8
- **Canvas Engine**: HTML5 Canvas 2D (Pure TypeScript)
- **Backend & Auth**: Firebase Auth (Google Provider) & Firestore
- **Testing**: Vitest (51 automated tests)
- **Mobile Bridge (Upcoming)**: Capacitor for Android / Google Play Store

---

## 🚀 التشغيل والتطوير · Getting Started

### المتطلبات · Prerequisites
- [Node.js](https://nodejs.org/) (v20 أو أحدث)
- npm

### خطوات التشغيل · Steps

1. **تثبيت الحزم (Install Dependencies)**:
   ```bash
   npm install
   ```

2. **تشغيل الخادم المحلي (Start Dev Server)**:
   ```bash
   npm run dev
   ```
   افتح المتصفح على: `http://localhost:5173`

3. **فحص الأنواع البرمجية (Type Check)**:
   ```bash
   npm run check
   ```

4. **تشغيل الاختبارات التلقائية (Run Tests)**:
   ```bash
   npm test
   ```

5. **بناء النسخة النهائية (Build Production)**:
   ```bash
   npm run build
   ```

---

## 📄 التوثيق المعماري · Documentation

للاطلاع على تفاصيل البنية الهندسية وشرح كل ملف، راجع ملف [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md).
