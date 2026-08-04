import HeroSection from '../components/home/HeroSection'
import SearchCard from '../components/home/SearchCard'
import FeatureHighlights from '../components/home/FeatureHighlights'
import GallerySection from '../components/home/GallerySection'
import AboutSection from '../components/home/AboutSection'

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <SearchCard />
      <FeatureHighlights />
      <GallerySection />
      <AboutSection />
    </div>
  )
}