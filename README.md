# Product Matching Evaluation Tool

This repository contains a web-based evaluation tool for testing the ability to match products from a catalog to the correct menu items from various retailers.

## Setup Instructions

1. Clone this repository to your local machine or download the files
2. Place your CSV file of questions in the root directory named `matching_eval_dataset.csv`
3. Open `index.html` in a web browser to start the evaluation

## CSV File Format

The evaluation requires a CSV file with the following column structure:

### Product Information (What you're matching TO):
- `PRODUCT_ID`: Unique identifier for the product
- `PRODUCT_NAME`: Name of the product in the catalog
- `PRODUCT_DESCRIPTION`: Description of the product
- `PRODUCT_IMAGE_TEXT`: Text extracted from product images
- `PRODUCT_BRAND`: Brand of the product
- `PRODUCT_BRAND_ID`: Numeric brand identifier
- `PRODUCT_REGIONS`: Regions where the product is available
- `PRODUCT_CATEGORY`: Product category (flower, edibles, etc.)
- `CURATION_TYPE`: How this question was curated
- `CORRECT_MENU_ITEM_IDS`: Semicolon-separated list of correct menu item IDs

### Menu Item Options (What you're matching FROM):
For each of the 10 menu item options, the following columns are required:
- `ID_OPTION_X`: Menu item ID (where X is 1-10)
- `NAME_OPTION_X`: Menu item name
- `BODY_OPTION_X`: Menu item description
- `BRAND_ID_OPTION_X`: Brand ID of the menu item
- `BRAND_OPTION_X`: Brand name of the menu item
- `REGIONS_OPTION_X`: Regions where this menu item is available
- `CATEGORY_OPTION_X`: Category of the menu item
- `PER_PACK_COUNT_OPTION_X`: Number of items per package (if applicable)
- `IMAGE_EXTRACTED_TEXT_OPTION_X`: Text extracted from menu item images
- `WEIGHTS_OPTION_X`: Weight/size information
- `COMPLIANCE_MGS_OPTION_X`: Amount in milligrams
- `MG_SLUGS_OPTION_X`: Unit for the amount (mg, g, etc.)

## How the Evaluation Works

1. **Product Display**: Each question shows a product from your catalog with details including:
   - Product name, brand, and description
   - Available regions and category
   - Image text (if available)

2. **Menu Item Selection**: Users are presented with 10 menu item options plus a "None of the above" option

3. **Matching Task**: Users must select ALL menu items that match the given product, considering:
   - Brand compatibility
   - Product name/type matching
   - Variant details (weight, potency, count)
   - Regional availability

4. **Multiple Selection**: Unlike traditional single-choice questions, users can select multiple menu items if they all represent the same product

## How to Use

1. Enter your name and email on the welcome screen
2. For each question:
   - Review the product details carefully
   - Evaluate each menu item option against the product
   - Select ALL menu items that match the product
   - Add optional notes if needed
   - Click "Save & Continue" to save your response
3. Navigate using "Previous Question" and "Next Question" buttons
4. Use the "Skip to question" feature to jump to specific questions
5. Export your progress as CSV at any time
6. Complete all questions and download your final answer key

## Answer Key Format

The downloaded answer key will be a CSV file with the following columns:
- `Question Index`: Sequential question number (1, 2, 3, ...)
- `Product ID`: ID of the product being matched
- `Product Name`: Name of the product being matched
- `Selected Menu Item IDs`: Semicolon-separated list of selected menu item IDs
- `Notes`: Any notes added for the question
- `Timestamp (UTC)`: When the response was saved

## Data Persistence

The evaluation uses your browser's local storage to automatically save progress:
- Responses are saved locally as you complete them
- You can close the browser and return later to continue
- Use "Start New Session" to clear all saved progress and start over
- Export CSV frequently to backup your progress

## Privacy & Data Security

- All data is stored locally in your browser
- No information is transmitted to external servers
- Your responses remain on your device until you download them
- Clear browser data to remove all stored responses

## Technical Requirements

- Modern web browser with JavaScript enabled
- Local file access (for CSV loading)
- Minimum screen resolution: 768px width recommended
- Internet connection required only for initial page load

## Troubleshooting

**CSV not loading?**
- Ensure the file is named exactly `matching_eval_dataset.csv`
- Check that the file is in the same directory as `index.html`
- Verify the CSV has all required columns

**Progress not saving?**
- Check that JavaScript is enabled
- Ensure you have sufficient browser storage space
- Export CSV frequently as backup

**Can't navigate between questions?**
- Make sure you've saved your current response before navigating
- Use the "Skip to question" feature if navigation buttons are disabled

## File Structure

```
project-root/
├── index.html              # Main application page
├── styles.css              # Styling and layout
├── quiz.js                 # Application logic (needs updating)
├── matching_eval_dataset.csv  # Your evaluation data
└── README.md              # This file
```

## Support

For technical issues or questions about the evaluation format, please check:
1. Browser console for error messages
2. CSV file format and column names
3. Browser compatibility and JavaScript settings