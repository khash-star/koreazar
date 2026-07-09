import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  appendAdminListingQueryParams,
  bannerMatchesAdminScope,
  canBroadcast,
  canManageGlobalConfig,
  canManageUsers,
  canModerateUser,
  filterBannersByAdminScope,
  filterListingsByAdminScope,
  getAdminRoleLabel,
  getAdminScope,
  isAppAdmin,
  isSuperAdmin,
  listingMatchesAdminScope,
} from '@/constants/adminRoles';

/** Scoped admin access for web admin pages. */
export function useAdminAccess() {
  const { userData } = useAuth();

  return useMemo(() => {
    const adminScope = getAdminScope(userData);
    return {
      isAdmin: isAppAdmin(userData),
      isSuperAdmin: isSuperAdmin(userData),
      adminScope,
      adminRoleLabel: getAdminRoleLabel(adminScope.role),
      canManageUsers: canManageUsers(userData),
      canBroadcast: canBroadcast(userData),
      canManageGlobalConfig: canManageGlobalConfig(userData),
      listingQueryParams: appendAdminListingQueryParams(userData, {}),
      listingMatchesScope: (listing) => listingMatchesAdminScope(userData, listing),
      bannerMatchesScope: (banner) => bannerMatchesAdminScope(userData, banner),
      filterListings: (listings) => filterListingsByAdminScope(userData, listings),
      filterBanners: (banners) => filterBannersByAdminScope(userData, banners),
      canModerateUser: (target) => canModerateUser(userData, target),
    };
  }, [userData]);
}
