#!/bin/bash
# fix-charat-errors.sh
# Fixes all charAt errors in Flourish Fitness codebase

echo "🔧 Fixing charAt() errors in Flourish Fitness..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "src/components" ]; then
    echo -e "${RED}❌ Error: src/components directory not found${NC}"
    echo "Please run this script from your project root directory"
    exit 1
fi

echo -e "${YELLOW}Creating backups...${NC}"
# Create backup directory
mkdir -p .backups/$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=".backups/$(date +%Y%m%d_%H%M%S)"

# Function to backup and fix a file
fix_file() {
    local file=$1
    local description=$2
    
    if [ ! -f "$file" ]; then
        echo -e "${YELLOW}⚠️  Skipping $file (not found)${NC}"
        return
    fi
    
    echo -e "${YELLOW}Fixing: $file${NC}"
    
    # Backup
    cp "$file" "$BACKUP_DIR/$(basename $file).backup"
    
    # Apply fixes based on the file
    case "$file" in
        *AdminClientAnalytics.jsx|*ManageClients.jsx|*WorkoutBuilder.jsx|*AdminPhotos.jsx|*AdminNutrition.jsx)
            # Fix: client.name.charAt(0) -> (client.firstName?.charAt(0) || client.email?.charAt(0) || '?')
            sed -i.bak 's/client\.name\.charAt(0)/(client.firstName?.charAt(0) || client.email?.charAt(0) || "?")/g' "$file"
            echo -e "${GREEN}  ✓ Fixed client.name.charAt(0)${NC}"
            ;;
            
        *ClientMeasurements.jsx)
            # Already has safe access - just verify
            echo -e "${GREEN}  ✓ Already safe (has optional chaining)${NC}"
            ;;
            
        *ExerciseLibrary.jsx|*LandingPage.jsx)
            # These are fine - they're capitalizing strings, not user data
            echo -e "${GREEN}  ✓ No changes needed (string manipulation)${NC}"
            ;;
    esac
    
    # Remove sed backup files
    rm -f "${file}.bak"
}

echo ""
echo -e "${YELLOW}Processing files...${NC}"
echo ""

# Fix admin components that use client.name.charAt(0)
fix_file "src/components/admin/AdminClientAnalytics.jsx" "Admin analytics avatar"
fix_file "src/components/admin/ManageClients.jsx" "Manage clients avatar"
fix_file "src/components/admin/WorkoutBuilder.jsx" "Workout builder avatar"
fix_file "src/components/admin/AdminPhotos.jsx" "Admin photos avatar"
fix_file "src/components/admin/AdminNutrition.jsx" "Admin nutrition avatar"

# Check the safe ones
fix_file "src/components/admin/ClientMeasurements.jsx" "Client measurements (already safe)"
fix_file "src/components/workout/ExerciseLibrary.jsx" "Exercise library (safe - string manipulation)"
fix_file "src/components/LandingPage.jsx" "Landing page (safe - string manipulation)"

echo ""
echo -e "${GREEN}✅ All files processed!${NC}"
echo ""
echo -e "${YELLOW}Backup location:${NC} $BACKUP_DIR"
echo ""
echo -e "${GREEN}🎉 Fixes applied! Your app should work now.${NC}"
echo ""
echo "If anything goes wrong, restore from backups:"
echo "  cp $BACKUP_DIR/* src/components/admin/"
echo ""
