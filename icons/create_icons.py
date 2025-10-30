from PIL import Image, ImageDraw, ImageFont

def create_icon(size, filename):
    # Create image with blue background
    img = Image.new('RGB', (size, size), color='#1a73e8')
    draw = ImageDraw.Draw(img)
    
    # Draw white lines (simplified URL representation)
    margin = size // 8
    line_height = size // 16
    
    # Three horizontal lines
    for i in range(3):
        y = margin + (i * (size // 4))
        draw.rectangle([margin, y, size - margin, y + line_height], fill='white')
    
    # Green circle (parameter indicator)
    circle_size = size // 8
    circle_pos = size - margin - circle_size
    draw.ellipse([circle_pos, circle_pos, circle_pos + circle_size * 2, 
                  circle_pos + circle_size * 2], fill='#34a853')
    
    img.save(filename)

# Create three sizes
create_icon(16, 'icon16.png')
create_icon(48, 'icon48.png')
create_icon(128, 'icon128.png')

print("Icons created successfully!")
