// import { cookieStorage, createStorage, http } from '@wagmi/core'
import { ConnectButton } from "@/components/ConnectButton";
import { InfoList } from "@/components/InfoList";
import { ActionButtonList } from "@/components/ActionButtonList";
import Image from 'next/image';

export default function Home() {

  return (
    <div className={"pages"}>
      <Image src="/logo.svg" alt="Reown" width={150} height={150} priority />
      <h1>Welcome To OpenBank!</h1>

      <ConnectButton />
      <ActionButtonList />
      <InfoList />
    </div>
  );
}