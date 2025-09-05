# Toggleable Table Views

This project now includes toggleable views between card layouts and data tables for all entity pages, built using TanStack Table.

## Features

- **Dual View Modes**: Switch between card view (default) and table view
- **Interactive Tables**: Sortable columns, searchable data, and pagination
- **Responsive Design**: Works on all screen sizes
- **Consistent UI**: All entity pages follow the same pattern

## Entity Pages with Toggleable Views

### Users (`/users`)
- **Card View**: User cards with avatars, contact info, and action buttons
- **Table View**: Sortable columns for name, email, role, department, status, and phone
- **Search**: Filter by email address

### Clients (`/clients`)
- **Card View**: Client cards with company info, contact details, and action buttons
- **Table View**: Sortable columns for name, type, email, phone, website, status, and address
- **Search**: Filter by client name

### Markets (`/markets`)
- **Card View**: Market cards with client association and territory info
- **Table View**: Sortable columns for name, client ID, created date, and updated date
- **Search**: Filter by market name

### Properties (`/properties`)
- **Card View**: Property cards with address, size, rent info, and action buttons
- **Table View**: Sortable columns for title, display number, address, size, rent, phase, market ID, and dates
- **Search**: Filter by property title

## Components

### ViewToggle
A reusable component that provides toggle buttons between card and table views.

```tsx
<ViewToggle 
  view={view} 
  onViewChange={setView} 
/>
```

### DataTable
A powerful table component built with TanStack Table that includes:
- Sorting (click column headers to sort)
- Filtering (search input for specified columns)
- Pagination (previous/next buttons)
- Column visibility toggle
- Responsive design

```tsx
<DataTable 
  columns={columns} 
  data={data} 
  searchKey="email"
  searchPlaceholder="Filter by email..."
/>
```

## Implementation Details

### State Management
Each entity page maintains a view state:
```tsx
const [view, setView] = useState<'cards' | 'table'>('cards')
```

### Conditional Rendering
Content is conditionally rendered based on the selected view:
```tsx
{view === 'cards' ? (
  // Card view JSX
) : (
  // Table view JSX
)}
```

### Column Definitions
Each entity has a `columns.tsx` file that defines:
- Data accessors
- Sortable headers
- Custom cell renderers
- Action menus

## Usage

1. Navigate to any entity page (Users, Clients, Markets, or Properties)
2. Use the toggle buttons in the top-right corner to switch between views
3. In table view:
   - Click column headers to sort
   - Use the search input to filter data
   - Use the "Columns" dropdown to show/hide columns
   - Navigate between pages using pagination controls

## Dependencies

- `@tanstack/react-table`: Core table functionality
- `shadcn/ui`: UI components (table, button, input, dropdown, etc.)
- `lucide-react`: Icons for the toggle buttons

## Future Enhancements

- Row selection with bulk actions
- Export functionality (CSV, Excel)
- Advanced filtering options
- Custom column ordering
- Saved view preferences
- Keyboard shortcuts for navigation
