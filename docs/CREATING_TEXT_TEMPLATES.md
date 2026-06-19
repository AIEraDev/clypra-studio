# Creating Custom Text Templates - Complete Guide

This guide shows you how to create templates like "Chapter 1 / THE ACCIDENTAL EMPIRE" with proper alignment, colors, fonts, and animations using the Clypra Text Templates editor.

## 🎯 Overview of the Example Template

**Target Design:**

```
Chapter 1                    ← Small text, top-left
█ THE ACCIDENTAL            ← Red bar + Large bold text
  EMPIRE
```

## 📋 Available Controls in Text Templates Editor

### 1. **Layer Properties** (Right Sidebar when layer selected)

#### Text Layer Controls:

- **Layer ID**: Unique identifier for the layer
- **Static Text Content**: The actual text displayed
- **Font Family**: Choose from Poppins, Inter, Arial, Montserrat, Roboto
- **Font Size**: Size in pixels
- **Text Color**: Color picker + hex input
- **Text Alignment**: Left, Center, Right
- **Role Mapping**: primary, secondary, or accent (determines which test input controls it)

#### Shape Layer Controls:

- **Shape Style**: Rectangle, Circle/Ellipse, Line
- **Fill Color**: Color picker + hex input

#### Image Layer Controls:

- **Image URL**: External image source

### 2. **Layout & Positioning**

All layers have these coordinate controls:

- **X Coordinate**: Horizontal position (pixels from left edge)
- **Y Coordinate**: Vertical position (pixels from top edge)
- **Width**: Layer width in pixels
- **Height**: Layer height in pixels

**Canvas Default**: 1920×1080 pixels

### 3. **Animation Controls**

Each layer supports:

**Entrance Animations:**

- `fade` - Fade in
- `slide-up` - Slide from bottom
- `slide-down` - Slide from top
- `slide-left` - Slide from right
- `slide-right` - Slide from left
- `scale-in` - Scale from small
- `blur-in` - Blur and fade in
- `typewriter` - Character-by-character reveal
- `none` - No entrance animation

**Exit Animations:**

- `fade` - Fade out
- `slide-down` - Slide down
- `slide-up` - Slide up
- `scale-out` - Scale to small
- `blur-out` - Blur and fade out
- `none` - No exit animation

**Timing:**

- **In Duration**: How long entrance animation takes (seconds)
- **Out Duration**: How long exit animation takes (seconds)
- **Hold Timing**: How long layer stays visible between transitions

### 4. **Test Customization Inputs**

Live preview test inputs (top section):

- **Primary Text**: Tests layers with `role: "primary"`
- **Secondary Text**: Tests layers with `role: "secondary"`
- **Accent Text**: Tests layers with `role: "accent"`

## 🎨 Step-by-Step: Creating "Chapter 1 / THE ACCIDENTAL EMPIRE"

### Step 1: Set Up Canvas

1. Click on template settings (no layer selected)
2. Set **Canvas Width**: 1920
3. Set **Canvas Height**: 1080
4. Set **Duration**: 3-5 seconds (adjust as needed)

### Step 2: Create "Chapter 1" Text Layer

**Add a new text layer** with these properties:

**Text Properties:**

- **Layer ID**: `chapter-number`
- **Static Text Content**: `Chapter 1`
- **Font Family**: `Poppins` or `Montserrat`
- **Font Size**: `36` (relatively small)
- **Text Color**: `#FFFFFF` (white)
- **Text Alignment**: `left`
- **Role Mapping**: `accent`

**Positioning:**

- **X Coordinate**: `150` (150px from left edge)
- **Y Coordinate**: `120` (120px from top)
- **Width**: `300`
- **Height**: `50`

**Animation:**

- **Entrance Preset**: `fade` or `slide-down`
- **In Duration**: `0.5`
- **Hold**: `full` (stays visible entire duration)
- **Exit Preset**: `fade`
- **Out Duration**: `0.5`

### Step 3: Create Red Accent Bar (Shape Layer)

**Add a new shape layer** with these properties:

**Shape Properties:**

- **Layer ID**: `accent-bar`
- **Shape Style**: `rect` (Rectangle)
- **Fill Color**: `#DC2626` (red) or `#EF4444`

**Positioning:**

- **X Coordinate**: `150` (aligned with text)
- **Y Coordinate**: `180` (below "Chapter 1")
- **Width**: `8` (thin vertical bar)
- **Height**: `120` (height of main text block)

**Animation:**

- **Entrance Preset**: `slide-right` or `scale-in`
- **In Duration**: `0.4`
- **Hold**: `full`
- **Exit Preset**: `fade`
- **Out Duration**: `0.3`

### Step 4: Create "THE ACCIDENTAL EMPIRE" Text Layer

**Add a new text layer** with these properties:

**Text Properties:**

- **Layer ID**: `main-title`
- **Static Text Content**: `THE ACCIDENTAL EMPIRE`
- **Font Family**: `Poppins` (Bold weight implied by size)
- **Font Size**: `72` (large and bold)
- **Text Color**: `#FFFFFF` (white)
- **Text Alignment**: `left`
- **Role Mapping**: `primary`

**Positioning:**

- **X Coordinate**: `170` (20px to the right of the red bar)
- **Y Coordinate**: `175` (aligned with top of red bar)
- **Width**: `900` (wide enough for text)
- **Height**: `130` (tall enough for 2 lines)

**Animation:**

- **Entrance Preset**: `slide-left` or `typewriter` (typewriter for dramatic effect)
- **In Duration**: `0.8` (slower for impact)
- **Hold**: `full`
- **Exit Preset**: `fade`
- **Out Duration**: `0.5`

### Step 5: Timing & Staggering (Optional)

To create a staggered reveal effect:

1. Have the red bar animate in first (`inDuration: 0.4`)
2. Then the main title (`inDuration: 0.8`, but starts slightly later via timeline)
3. "Chapter 1" can fade in simultaneously or slightly before

## 🎬 Animation Tips

### Recommended Animation Sequences:

**Option 1: Sequential Reveal**

1. Red bar slides in (`slide-right`, 0.3s)
2. Main title types in (`typewriter`, 1.0s)
3. Chapter text fades in (`fade`, 0.5s)

**Option 2: Synchronized Pop**

1. All elements fade in together (`fade`, 0.5s)
2. Red bar scales in slightly faster (`scale-in`, 0.3s)

**Option 3: Dramatic Build**

1. Chapter text appears first (`fade`, 0.3s)
2. Red bar slides in (`slide-right`, 0.4s)
3. Main title slides in with blur (`slide-left` + `blur-in`, 0.6s)

## 📐 Positioning Reference

For a **1920×1080 canvas**, use these regions:

### Horizontal Alignment:

- **Left**: X = 100-200
- **Center**: X = 960 (canvas width / 2)
- **Right**: X = 1720-1820

### Vertical Alignment:

- **Top**: Y = 100-200
- **Center**: Y = 540 (canvas height / 2)
- **Bottom**: Y = 880-980

### Text Size Guidelines:

- **Headline**: 60-100px
- **Subheadline**: 36-48px
- **Body/Accent**: 24-32px
- **Small**: 18-24px

## 🎨 Color Recommendations

### Professional Color Schemes:

**Red Accent (like your example):**

- Bar: `#DC2626` (red-600)
- Text: `#FFFFFF` (white)
- Background: Dark or blurred

**Blue Accent:**

- Bar: `#2563EB` (blue-600)
- Text: `#FFFFFF`

**Teal Accent:**

- Bar: `#14B8A6` (teal-500)
- Text: `#FFFFFF`

**Gold Accent:**

- Bar: `#F59E0B` (amber-500)
- Text: `#1F2937` (dark gray) for contrast

## 🔧 Workflow Tips

### Creating Templates Efficiently:

1. **Start with structure** - Add all layers first without worrying about perfect positioning
2. **Use the layer list** - Click layers in the left panel to select and edit them
3. **Test with real content** - Use the "Test Customizations" inputs to see how your text flows
4. **Adjust spacing** - Fine-tune X/Y coordinates by increments of 10-20px
5. **Preview animations** - Use the play button and timeline scrubber to see timing
6. **Save often** - Use the save icon in the header
7. **Export for sharing** - Use the "Publish Template" button to create a PR

### Common Issues & Fixes:

**Text not centered?**

- Check X coordinate = (canvasWidth - textWidth) / 2
- For 1920px canvas and 800px text: X = (1920 - 800) / 2 = 560

**Colors not showing?**

- Verify hex format starts with `#`
- For shapes, use "Fill Color" not "Text Color"
- Check layer is not behind other layers

**Animation timing off?**

- Adjust "In Duration" to be faster (0.3s) or slower (1.0s)
- Use "Hold: full" to keep layers visible throughout
- Check total duration allows all animations to complete

**Text overlapping?**

- Increase Y coordinate spacing between layers (try 80-120px gaps)
- Adjust layer height to prevent cutoff
- Check font size isn't too large for the container

## 🚀 Advanced Techniques

### Multi-line Text:

For text that wraps like "THE ACCIDENTAL\nEMPIRE":

- Increase layer **Height** to accommodate multiple lines
- Set appropriate **Width** to force wrapping
- Use left alignment for cleaner wrapping

### Background Elements:

Add rectangles as background panels:

- **Fill**: Semi-transparent black (`#00000080`)
- **Width/Height**: Large enough to frame text
- **Layer Order**: Place behind text layers
- **Animation**: Fade in before text

### Dynamic Text Replacement:

Use role mapping to make text customizable:

- `role: "primary"` - Main headline (controlled by Primary Text input)
- `role: "secondary"` - Subtitle (controlled by Secondary Text input)
- `role: "accent"` - Small details (controlled by Accent Text input)

## 📝 Template Checklist

Before publishing your template:

- [ ] All text layers have appropriate roles assigned
- [ ] Colors are professional and have good contrast
- [ ] Positioning looks good at 1920×1080
- [ ] Animation entrance and exit are smooth
- [ ] Total duration allows all animations to complete
- [ ] Template works with different text lengths (test it!)
- [ ] Layer IDs are descriptive (e.g., `main-title`, `subtitle`)
- [ ] Template metadata is filled (ID, Title, Category)

## 🎓 Example Templates to Study

Study these built-in categories for inspiration:

- **Lower Third**: Bottom-aligned text with subtle backgrounds
- **Title**: Large centered headlines with animations
- **Subtitle**: Secondary text with complementary styling

## Need Help?

Check these resources:

- Review existing templates in the gallery
- Use the preview to test in real-time
- Adjust one property at a time to see its effect
- Save versions as you experiment

---

**Happy template creating!** 🎨✨
