# KisanOne - Agricultural Mobile App

## Complete UI Implementation Guide

This guide provides detailed instructions for placing images and assets in the KisanOne mobile application to achieve the modern agricultural e-commerce UI design.

## App Workflow

1. **Splash Screen** → 2. **Language Selection** → 3. **Login Screen** → 4. **OTP Verification** → 5. **Main App (Dashboard)**

## Image Placement Guide

### 1. Splash Screen (`src/SplashScreen.js`)

**Location**: `assets/splash-icon.png` (already exists)
**Usage**: Replace the emoji placeholder 🌱 with your actual KisanOne logo

**Logo Specifications**:
- **Size**: 120x120px (circular)
- **Format**: PNG with transparent background
- **Style**: Modern, agricultural theme with green color scheme
- **Placement**: Center of screen with white circular background

**Background Image** (Optional):
- **File**: `assets/splash-background.png`
- **Size**: Full screen (375x812px for iPhone X)
- **Style**: Agricultural landscape or farm imagery
- **Opacity**: 0.1-0.2 for subtle effect

### 2. Language Selection Screen (`src/LanguageSelection.js`)

**Logo**: Same as splash screen
- **Size**: 80x80px
- **Background**: Green circular background (#0e7c36)

### 3. Login & OTP Screens (`src/Login.js`)

**Logo**: Same as splash screen
- **Size**: 80x80px
- **Background**: Green circular background (#0e7c36)

### 4. Home Screen (`src/HomeScreen.js`)

#### Header Section
**User Profile Avatar**:
- **File**: `assets/profile-placeholder.png`
- **Size**: 40x40px
- **Style**: Circular, generic user silhouette
- **Background**: White circular background

**Weather Icon**:
- **File**: `assets/weather-cloud.png`
- **Size**: 16x16px
- **Style**: White cloud icon
- **Usage**: Next to temperature display

**Rewards/Points Icon**:
- **File**: `assets/rewards-icon.png`
- **Size**: 24x24px
- **Style**: Green leaf or agricultural symbol
- **Background**: Orange circular background (#FFA726)

**Notification Bell**:
- **File**: `assets/bell-icon.png`
- **Size**: 20x20px
- **Style**: White bell icon

**Shopping Cart**:
- **File**: `assets/cart-icon.png`
- **Size**: 20x20px
- **Style**: White shopping cart icon

**Search Icons**:
- **Magnifying Glass**: `assets/search-icon.png` (16x16px)
- **Microphone**: `assets/mic-icon.png` (16x16px)
- **Camera/Scan**: `assets/scan-icon.png` (20x20px)

#### Category Icons
**Location**: `assets/categories/`

1. **Offers**: `offers-icon.png` (60x60px)
   - Shopping cart with percentage symbol
   - Red color scheme (#FF6B6B)

2. **Insecticides**: `insecticides-icon.png` (60x60px)
   - Two small bottles (red and yellow)
   - Color: #4ECDC4

3. **Nutrients**: `nutrients-icon.png` (60x60px)
   - Multiple product boxes
   - Color: #45B7D1

4. **Fungicides**: `fungicides-icon.png` (60x60px)
   - Two product packages (green and purple)
   - Color: #96CEB4

5. **Vegetable**: `vegetable-icon.png` (60x60px)
   - White bag with green leaves
   - Color: #FFEAA7

6. **Seeds**: `seeds-icon.png` (60x60px)
   - Seed packets or plant sprouts
   - Color: #DDA0DD

7. **Tools**: `tools-icon.png` (60x60px)
   - Farming tools (shovel, rake, etc.)
   - Color: #98D8C8

8. **Equipment**: `equipment-icon.png` (60x60px)
   - Tractor or farming equipment
   - Color: #F7DC6F

#### Feature Icons
**Location**: `assets/features/`

1. **Safe Payment**: `safe-payment-icon.png` (24x24px)
   - Shield with checkmark and rupee symbol
   - Style: Flat design

2. **Expert Advice**: `expert-advice-icon.png` (24x24px)
   - Person with speech bubble
   - Style: Flat design

3. **Best Price**: `best-price-icon.png` (24x24px)
   - Thumbs up with rupee symbol
   - Style: Flat design

#### Promotional Banner
**File**: `assets/banner-agri-store.png`
- **Size**: Full width (375px width)
- **Aspect Ratio**: 2:1 or 3:1
- **Style**: Agricultural store interior or farm products
- **Background**: Gradient from light blue to light green
- **Text Overlay**: "Buy 100% Original Agri Products here.."

#### Product Images
**Location**: `assets/products/`

1. **Geolife No Virus**: `geolife-no-virus.png` (120x120px)
   - White bottle with red label
   - Clear product visibility

2. **Antracol Fungicide**: `antracol-fungicide.png` (120x120px)
   - White and green pouch
   - Fruit/vegetable illustrations

3. **Fantac Plus**: `fantac-plus.png` (120x120px)
   - White bottle with colorful label
   - Fruits/vegetables imagery

4. **Falcon Growth**: `falcon-growth.png` (120x120px)
   - White bottle with ribbed neck
   - Colorful label with "FALCON"

#### Discount Badges
**File**: `assets/discount-badge.png`
- **Size**: Template for orange rounded rectangles
- **Style**: Orange background (#FF6B6B) with white text
- **Usage**: Overlay on product images

### 5. Crop Doctor Screen (`src/CropDoctorScreen.js`)

#### Quick Action Icons
**Location**: `assets/crop-doctor/`

1. **Scan Plant**: `scan-plant-icon.png` (60x60px)
   - Camera with plant overlay
   - Color: #4CAF50

2. **Ask Expert**: `ask-expert-icon.png` (60x60px)
   - Doctor/agricultural expert silhouette
   - Color: #2196F3

3. **Disease Library**: `disease-library-icon.png` (60x60px)
   - Book with plant disease symbols
   - Color: #FF9800

4. **Treatment Guide**: `treatment-guide-icon.png` (60x60px)
   - Medicine bottle or treatment symbols
   - Color: #9C27B0

#### Issue Status Icons
- **High Severity**: Red color (#FF6B6B)
- **Medium Severity**: Orange color (#FFA726)
- **Low Severity**: Green color (#4CAF50)

### 6. My Orders Screen (`src/MyOrdersScreen.js`)

#### Order Status Icons
- **Delivered**: Green checkmark
- **Pending**: Orange clock
- **Cancelled**: Red X

#### Empty State
**File**: `assets/empty-orders.png`
- **Size**: 200x200px
- **Style**: Empty shopping bag or package
- **Usage**: When no orders are found

### 7. Vedika Screen (`src/VedikaScreen.js`)

#### Community Icons
**Location**: `assets/vedika/`

1. **User Avatars**: Generic user silhouettes
   - **Size**: 40x40px
   - **Style**: Circular with initials

2. **Post Images**: `post-images/`
   - **Farm Field**: `farm-field.png` (120x120px)
   - **Tomato Plants**: `tomato-plants.png` (120x120px)
   - **Weather**: `weather-forecast.png` (120x120px)

3. **Action Icons**:
   - **Like**: `like-icon.png` (16x16px)
   - **Comment**: `comment-icon.png` (16x16px)
   - **Share**: `share-icon.png` (16x16px)

#### Tips Icons
**Location**: `assets/tips/`

1. **Soil Testing**: `soil-testing-icon.png` (60x60px)
2. **Crop Rotation**: `crop-rotation-icon.png` (60x60px)
3. **Water Conservation**: `water-conservation-icon.png` (60x60px)

### 8. Agri Store Screen (`src/AgriStoreScreen.js`)

#### Brand Logos
**Location**: `assets/brands/`

1. **Bayer**: `bayer-logo.png` (60x60px)
2. **Syngenta**: `syngenta-logo.png` (60x60px)
3. **UPL**: `upl-logo.png` (60x60px)
4. **Coromandel**: `coromandel-logo.png` (60x60px)
5. **Mahindra**: `mahindra-logo.png` (60x60px)
6. **John Deere**: `john-deere-logo.png` (60x60px)

#### Offer Images
**Location**: `assets/offers/`

1. **Diwali Special**: `diwali-offer.png` (80x80px)
   - Diwali-themed agricultural products
2. **Seed Sale**: `seed-sale.png` (80x80px)
   - Various seed packets
3. **Tool Kit**: `tool-kit-offer.png` (80x80px)
   - Farming tools bundle

#### New Arrival Products
**Location**: `assets/new-arrivals/`

1. **Smart Irrigation**: `smart-irrigation.png` (120x120px)
2. **Organic Compost**: `organic-compost.png` (120x120px)
3. **Precision Seeder**: `precision-seeder.png` (120x120px)

## Navigation Icons

**Location**: `assets/navigation/`

1. **Home**: `home-icon.png` (20x20px)
2. **Crop Doctor**: `crop-doctor-icon.png` (20x20px)
3. **My Orders**: `orders-icon.png` (20x20px)
4. **Vedika**: `vedika-icon.png` (20x20px)
5. **Agri Store**: `agri-store-icon.png` (20x20px)

## Floating Action Buttons

1. **Customer Support**: `support-icon.png` (24x24px)
   - Headset or customer service symbol
   - Orange background (#FF6B6B)

2. **Create Post**: `create-post-icon.png` (24x24px)
   - Pencil or plus symbol
   - Green background (#0e7c36)

## Image Specifications Summary

### File Formats
- **Primary**: PNG with transparency
- **Fallback**: JPG for complex images
- **Icons**: SVG preferred for scalability

### Resolution Guidelines
- **@1x**: Base resolution
- **@2x**: 2x resolution for high-DPI screens
- **@3x**: 3x resolution for very high-DPI screens

### Color Scheme
- **Primary Green**: #0e7c36
- **Accent Orange**: #FF6B6B, #FFA726
- **Background White**: #FFFFFF
- **Text Dark**: #333333
- **Text Light**: #666666, #999999

### File Organization
```
assets/
├── splash-icon.png
├── splash-background.png
├── profile-placeholder.png
├── weather-cloud.png
├── rewards-icon.png
├── bell-icon.png
├── cart-icon.png
├── search-icon.png
├── mic-icon.png
├── scan-icon.png
├── categories/
│   ├── offers-icon.png
│   ├── insecticides-icon.png
│   ├── nutrients-icon.png
│   ├── fungicides-icon.png
│   ├── vegetable-icon.png
│   ├── seeds-icon.png
│   ├── tools-icon.png
│   └── equipment-icon.png
├── features/
│   ├── safe-payment-icon.png
│   ├── expert-advice-icon.png
│   └── best-price-icon.png
├── products/
│   ├── geolife-no-virus.png
│   ├── antracol-fungicide.png
│   ├── fantac-plus.png
│   └── falcon-growth.png
├── crop-doctor/
│   ├── scan-plant-icon.png
│   ├── ask-expert-icon.png
│   ├── disease-library-icon.png
│   └── treatment-guide-icon.png
├── vedika/
│   ├── post-images/
│   │   ├── farm-field.png
│   │   ├── tomato-plants.png
│   │   └── weather-forecast.png
│   └── tips/
│       ├── soil-testing-icon.png
│       ├── crop-rotation-icon.png
│       └── water-conservation-icon.png
├── brands/
│   ├── bayer-logo.png
│   ├── syngenta-logo.png
│   ├── upl-logo.png
│   ├── coromandel-logo.png
│   ├── mahindra-logo.png
│   └── john-deere-logo.png
├── offers/
│   ├── diwali-offer.png
│   ├── seed-sale.png
│   └── tool-kit-offer.png
├── new-arrivals/
│   ├── smart-irrigation.png
│   ├── organic-compost.png
│   └── precision-seeder.png
└── navigation/
    ├── home-icon.png
    ├── crop-doctor-icon.png
    ├── orders-icon.png
    ├── vedika-icon.png
    └── agri-store-icon.png
```

## Implementation Notes

1. **Replace Emoji Placeholders**: All emoji placeholders (🌱, 🏠, etc.) should be replaced with actual image components
2. **Responsive Design**: Images should scale properly across different screen sizes
3. **Loading States**: Implement loading placeholders for images
4. **Error Handling**: Provide fallback images for failed loads
5. **Performance**: Optimize images for mobile performance
6. **Accessibility**: Include alt text for screen readers

## Color Palette Reference

- **Primary Green**: #0e7c36 (Headers, buttons, active states)
- **Light Green**: #E8F5E8 (Backgrounds, accents)
- **Orange**: #FF6B6B, #FFA726 (Discounts, highlights)
- **White**: #FFFFFF (Backgrounds, cards)
- **Dark Gray**: #333333 (Primary text)
- **Medium Gray**: #666666 (Secondary text)
- **Light Gray**: #999999 (Placeholder text)
- **Border Gray**: #E0E0E0 (Borders, separators)

This guide ensures consistent implementation of the modern agricultural e-commerce UI design across all screens of the KisanOne application.
