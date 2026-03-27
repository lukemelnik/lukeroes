import { createContext, useContext, useMemo, type ReactNode } from "react";

interface MembershipContextValue {
  isMember: boolean;
  isLoggedIn: boolean;
}

const MembershipContext = createContext<MembershipContextValue>({
  isMember: false,
  isLoggedIn: false,
});

export function MembershipProvider({
  isMember,
  isLoggedIn,
  children,
}: {
  isMember: boolean;
  isLoggedIn: boolean;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ isMember, isLoggedIn }), [isMember, isLoggedIn]);

  return <MembershipContext.Provider value={value}>{children}</MembershipContext.Provider>;
}

export function useMembership() {
  return useContext(MembershipContext);
}
