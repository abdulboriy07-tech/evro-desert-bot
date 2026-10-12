import ContactPage from "./components/contactpage";
import Choose from "./components/choose";
import Herosection from "./components/Herosection";
import Offer from "./components/Offer";

export default function Home(){
  
  return(
    <main className = "flex  items-center flex-col justify-center w-full">
      <Herosection/>
      <Offer/>
      <Choose/>
      <ContactPage/>
    </main>
  );
}