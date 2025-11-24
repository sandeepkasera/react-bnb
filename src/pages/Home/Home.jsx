import PropertyGrid from '../../components/PropertyGrid/PropertyGrid';
import PropertyFilters from '../../components/PropertyFilters/PropertyFilters';
import { FiltersProvider } from '../../context/FiltersContext';
import './Home.scss';

const Home = () => {
  return (
    <FiltersProvider>
      <div className="home-page">
        <div className="home-filters">
          <PropertyFilters />
        </div>
        <div className="home-content">
          <PropertyGrid />
        </div>
      </div>
    </FiltersProvider>
  );
};

export default Home;
