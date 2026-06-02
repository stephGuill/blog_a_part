import "./Avatar.css";

function Avatar({ name = "BlogYoo", src }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className="avatar">
      {src ? <img alt={name} src={src} /> : initials}
    </span>
  );
}

export default Avatar;
