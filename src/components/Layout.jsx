import { A, useNavigate } from "@solidjs/router"
import { useAuth } from "../context/AuthContext.jsx"
import User from "lucide-solid/icons/user"
import LogOut from "lucide-solid/icons/log-out"

export default function Layout(props) {
  const { user, logout, loading } = useAuth()
  const navigate = useNavigate()

  function loginButton() {
    return (
      <button
        class="flex gap-2 font-mono text-sm text-neutral-600 items-center hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-850 p-2 rounded-xl"
        onClick={() => navigate("/login")}>
        Login
        <User size={14} />
      </button>
    )
  }

  return (
    <>
      <nav class="flex justify-between items-center p-4 max-w-[60ch] mx-auto">
        <A href="/" class="font-mono">md</A>
        <Show when={!loading()} fallback={<div class="w-6 h-6 rounded-md animate-pulse bg-neutral-200 dark:bg-neutral-800" />}>
          <Show when={user()} fallback={loginButton}>
            <span class="flex gap-2 items-center text-sm text-neutral-600 hover:bg-neutral-100 p-2 rounded-xl">
              {user().name}
            </span>
          </Show>
        </Show>
      </nav>
      <main class="px-4 max-w-[60ch] mx-auto mt-8 mb-16">
        {props.children}
      </main>
    </>
  )
}

