export function getRedirectPathByRole(role) {
  switch (role) {
    case "admin":
      return "/admin";
    case "owner":
      return "/owner";
    case "editor":
      return "/editor";
    case "moderator":
      return "/moderator";
    default:
      return "/profile";
  }
}
