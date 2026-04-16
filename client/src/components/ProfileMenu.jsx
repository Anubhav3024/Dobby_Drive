import { useMemo } from "react";

function initialsFromUser(user) {
  const name = String(user?.name || "").trim();
  if (!name) {
    const email = String(user?.email || "").trim();
    return email ? email.slice(0, 2).toUpperCase() : "U";
  }
  const parts = name.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "U";
  const second = (parts[1]?.[0] || parts[0]?.[1] || "").toUpperCase();
  return (first + second).toUpperCase();
}

export default function ProfileMenu({ user }) {
  const initials = useMemo(() => initialsFromUser(user), [user]);

  return (
    <div className="profile" aria-label="Account">
      <div className="profile-btn profile-btn--static">
        <span className="avatar" aria-hidden="true">
          {initials}
        </span>
        <span className="profile-name">{user?.name || "Account"}</span>
      </div>
    </div>
  );
}
