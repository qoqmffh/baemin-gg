export default function PageBackground() {
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        backgroundImage: "url('image/backgroun_home.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    />
  );
}
