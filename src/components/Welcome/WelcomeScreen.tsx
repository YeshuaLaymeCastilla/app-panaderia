export default function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="welcome">
      <div className="welcomeCard">
        <h1 className="welcomeTitle">BIENVENIDO</h1>
        <button className="btnStartDay" onClick={onStart}>
          INICIAR DÍA
        </button>
      </div>
    </div>
  );
}
