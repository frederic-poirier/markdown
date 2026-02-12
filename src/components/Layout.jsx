export function Layout(props) {
  return (
    <div class="min-h-screen bg-[#111]">
      <main class="max-w-[680px] mx-auto px-6 py-16">
        {props.children}
      </main>
    </div>
  );
}
