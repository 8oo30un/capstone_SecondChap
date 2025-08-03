"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function AuthButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <>
        <p>안녕하세요, {session.user?.name}님</p>
        <button onClick={() => signOut()}>로그아웃</button>
      </>
    );
  }

  return <button onClick={() => signIn()}>로그인</button>;
}
