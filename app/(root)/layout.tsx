import React from "react";
import Sidebar from "@/components/Sidebar";
import MobileNavigation from "@/components/MobileNavigation";
import Header from "@/components/Header";
import DropZoneArea from "@/components/DropZoneArea";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const dynamic = "force-dynamic";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();

  if (!session?.user) return redirect("/sign-in");

  const user = {
    fullName: session.user.name ?? "User",
    email: session.user.email ?? "",
    avatar: session.user.image ?? "/assets/icons/logo-brand.svg",
    $id: session.user.id ?? "",
    accountId: session.user.email ?? "",
  };

  return (
    <main className="flex h-screen">
      <Sidebar fullName={user.fullName} avatar={user.avatar} email={user.email} />

      <section className="flex h-full flex-1 flex-col">
        <MobileNavigation {...user} />
        <Header />
        <DropZoneArea>
          <div className="main-content">{children}</div>
        </DropZoneArea>
      </section>

      <ToastContainer position="top-center" theme="colored" autoClose={4000} closeButton />
    </main>
  );
};
export default Layout;
