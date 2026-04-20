# Neumorphic Style Cleanup TODO

**Goal:** Remove neumorphic styles from all files EXCEPT `src/app/components/Sidebar.tsx`

**Neumorphic Patterns to Remove:**
- `bg-[#e0e5ec]` → Replace with `bg-white` or `bg-slate-50`
- `bg-[#e6e9ef]` → Replace with `bg-white` or `bg-slate-50`
- `bg-[#f0f4f8]` → Replace with `bg-white` or `bg-slate-50`
- `shadow-[12px_12px_24px_#bebebe,-12px_-12px_24px_#ffffff]` → Replace with `shadow-md` or `shadow-lg`
- `shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]` → Replace with `shadow-md`
- `shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff]` → Replace with `shadow-sm` or `shadow-md`
- `shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff]` → Replace with `shadow-sm`
- `shadow-[inset_4px_4px_8px_#a3b1c6,inset_-4px_-4px_8px_#ffffff]` → Replace with `bg-slate-100` or `border border-slate-200`
- `shadow-[inset_2px_2px_4px_#a3b1c6,inset_-2px_-2px_4px_#ffffff]` → Replace with `bg-slate-100`
- `rounded-[24px]`, `rounded-[30px]`, `rounded-[20px]`, `rounded-[16px]` → Replace with standard `rounded-xl` or `rounded-2xl`

**Files to Clean Up:**

- [x] `src/app/cleaned-vehicles/page.tsx` - Header, stats cards, table, filters ✅ COMPLETED
- [x] `src/app/cleaned-vehicles/[id]/view/page.tsx` - Vehicle detail cards, image sections ✅ COMPLETED
- [ ] `src/app/(app)/page.tsx` - Replace NeuDashboardSkeleton import
- [ ] `src/app/login/page.tsx` - Shadow styles
- [ ] `src/app/components/dashboard/EnhancedDashboard.tsx` - Dashboard cards, stats
- [ ] `src/app/components/dashboard/Dashboard.tsx` - Dashboard cards, charts
- [ ] `src/app/components/skeletons/NeuDashboardSkeleton.tsx` - Skeleton loader
- [ ] `src/app/components/skeletons/index.ts` - Check exports
- [ ] `src/app/components/lms/LmsDashboard.tsx` - LMS cards and stats
- [ ] `src/app/(app)/lms/page.tsx` - LMS page skeleton
- [ ] `src/app/(app)/lms/course/[categoryId]/page.tsx` - Course page
- [ ] `src/app/(app)/lms/lesson/[id]/page.tsx` - Lesson page
- [ ] `src/app/components/lms/LessonCard.tsx` - Lesson cards
- [ ] `src/app/components/lms/VideoPlayer.tsx` - Video player
- [ ] `src/app/components/VehicleCard.tsx` - Vehicle cards
- [ ] `src/app/components/VehicleList.tsx` - Vehicle list
- [ ] `src/app/components/OptimizedVehicleList.tsx` - Optimized list
- [ ] `src/app/components/TopBar.tsx` - Top bar
- [ ] `src/app/components/MobileBottomNav.tsx` - Mobile nav
- [ ] `src/app/components/filters/FilterPanel.tsx` - Filter panel
- [ ] `src/app/components/filters/FilterChip.tsx` - Filter chips
- [ ] `src/components/ui/glass/GlassCard.tsx` - Glass cards
- [ ] `src/components/ui/glass/GlassButton.tsx` - Glass buttons
- [ ] `src/components/ui/neu/` - Neumorphic UI components folder

**KEEP (Do Not Modify):**
- [x] `src/app/components/Sidebar.tsx` - Menu must keep neumorphic style

**Progress:**
Started: [Date]
Completed: [Date]
