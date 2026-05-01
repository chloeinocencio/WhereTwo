import { useState, useEffect, useRef } from 'react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import logoImg from '../../assets/daily.png';
import headerImg from '../../assets/header.jpg';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { MapPin, Calendar as CalendarIcon, Users, Plus, LogOut, Trash2, Settings, User, UserCircle, Pencil, Save, X, ArrowLeft } from 'lucide-react';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { format, differenceInDays, addDays } from 'date-fns';

const ACTIVITY_INTERESTS = [
  { id: 'culture', label: 'Culture & Heritage' },
  { id: 'culinary', label: 'Culinary Experiences' },
  { id: 'outdoor', label: 'Outdoor & Adventure' },
  { id: 'arts', label: 'Arts & Entertainment' },
  { id: 'shopping', label: 'Shopping & Markets' },
  { id: 'wellness', label: 'Wellness & Relaxation' },
  { id: 'nightlife', label: 'Nightlife & Social' },
  { id: 'photography', label: 'Photography & Scenic' },
];

const PACE_OPTIONS = [
  {
    id: 'leisurely',
    label: 'Leisurely',
    description: '2–3 key experiences per day with time to truly absorb each moment',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    description: '4–5 curated activities blending exploration with relaxed downtime',
  },
  {
    id: 'immersive',
    label: 'Immersive',
    description: '6+ experiences per day, maximizing every hour of your trip',
  },
];

const POPULAR_DESTINATIONS = [
  // East Asia
  { city: 'Tokyo', country: 'Japan', full: 'Tokyo, Japan' },
  { city: 'Kyoto', country: 'Japan', full: 'Kyoto, Japan' },
  { city: 'Osaka', country: 'Japan', full: 'Osaka, Japan' },
  { city: 'Hiroshima', country: 'Japan', full: 'Hiroshima, Japan' },
  { city: 'Nara', country: 'Japan', full: 'Nara, Japan' },
  { city: 'Sapporo', country: 'Japan', full: 'Sapporo, Japan' },
  { city: 'Fukuoka', country: 'Japan', full: 'Fukuoka, Japan' },
  { city: 'Seoul', country: 'South Korea', full: 'Seoul, South Korea' },
  { city: 'Busan', country: 'South Korea', full: 'Busan, South Korea' },
  { city: 'Jeju', country: 'South Korea', full: 'Jeju, South Korea' },
  { city: 'Beijing', country: 'China', full: 'Beijing, China' },
  { city: 'Shanghai', country: 'China', full: 'Shanghai, China' },
  { city: 'Guangzhou', country: 'China', full: 'Guangzhou, China' },
  { city: 'Shenzhen', country: 'China', full: 'Shenzhen, China' },
  { city: 'Chengdu', country: 'China', full: 'Chengdu, China' },
  { city: "Xi'an", country: 'China', full: "Xi'an, China" },
  { city: 'Hangzhou', country: 'China', full: 'Hangzhou, China' },
  { city: 'Guilin', country: 'China', full: 'Guilin, China' },
  { city: 'Hong Kong', country: 'China', full: 'Hong Kong, China' },
  { city: 'Macau', country: 'China', full: 'Macau, China' },
  { city: 'Taipei', country: 'Taiwan', full: 'Taipei, Taiwan' },
  { city: 'Tainan', country: 'Taiwan', full: 'Tainan, Taiwan' },
  { city: 'Ulaanbaatar', country: 'Mongolia', full: 'Ulaanbaatar, Mongolia' },
  // Southeast Asia
  { city: 'Singapore', country: 'Singapore', full: 'Singapore' },
  { city: 'Bangkok', country: 'Thailand', full: 'Bangkok, Thailand' },
  { city: 'Chiang Mai', country: 'Thailand', full: 'Chiang Mai, Thailand' },
  { city: 'Phuket', country: 'Thailand', full: 'Phuket, Thailand' },
  { city: 'Krabi', country: 'Thailand', full: 'Krabi, Thailand' },
  { city: 'Koh Samui', country: 'Thailand', full: 'Koh Samui, Thailand' },
  { city: 'Hanoi', country: 'Vietnam', full: 'Hanoi, Vietnam' },
  { city: 'Ho Chi Minh City', country: 'Vietnam', full: 'Ho Chi Minh City, Vietnam' },
  { city: 'Hoi An', country: 'Vietnam', full: 'Hoi An, Vietnam' },
  { city: 'Da Nang', country: 'Vietnam', full: 'Da Nang, Vietnam' },
  { city: 'Nha Trang', country: 'Vietnam', full: 'Nha Trang, Vietnam' },
  { city: 'Ha Long Bay', country: 'Vietnam', full: 'Ha Long Bay, Vietnam' },
  { city: 'Kuala Lumpur', country: 'Malaysia', full: 'Kuala Lumpur, Malaysia' },
  { city: 'Penang', country: 'Malaysia', full: 'Penang, Malaysia' },
  { city: 'Langkawi', country: 'Malaysia', full: 'Langkawi, Malaysia' },
  { city: 'Kota Kinabalu', country: 'Malaysia', full: 'Kota Kinabalu, Malaysia' },
  { city: 'Bali', country: 'Indonesia', full: 'Bali, Indonesia' },
  { city: 'Jakarta', country: 'Indonesia', full: 'Jakarta, Indonesia' },
  { city: 'Yogyakarta', country: 'Indonesia', full: 'Yogyakarta, Indonesia' },
  { city: 'Lombok', country: 'Indonesia', full: 'Lombok, Indonesia' },
  { city: 'Komodo', country: 'Indonesia', full: 'Komodo, Indonesia' },
  { city: 'Manila', country: 'Philippines', full: 'Manila, Philippines' },
  { city: 'Cebu', country: 'Philippines', full: 'Cebu, Philippines' },
  { city: 'Boracay', country: 'Philippines', full: 'Boracay, Philippines' },
  { city: 'Palawan', country: 'Philippines', full: 'Palawan, Philippines' },
  { city: 'Siem Reap', country: 'Cambodia', full: 'Siem Reap, Cambodia' },
  { city: 'Phnom Penh', country: 'Cambodia', full: 'Phnom Penh, Cambodia' },
  { city: 'Luang Prabang', country: 'Laos', full: 'Luang Prabang, Laos' },
  { city: 'Vientiane', country: 'Laos', full: 'Vientiane, Laos' },
  { city: 'Yangon', country: 'Myanmar', full: 'Yangon, Myanmar' },
  { city: 'Mandalay', country: 'Myanmar', full: 'Mandalay, Myanmar' },
  { city: 'Bagan', country: 'Myanmar', full: 'Bagan, Myanmar' },
  { city: 'Brunei', country: 'Brunei', full: 'Bandar Seri Begawan, Brunei' },
  // South Asia
  { city: 'Mumbai', country: 'India', full: 'Mumbai, India' },
  { city: 'Delhi', country: 'India', full: 'Delhi, India' },
  { city: 'Jaipur', country: 'India', full: 'Jaipur, India' },
  { city: 'Agra', country: 'India', full: 'Agra, India' },
  { city: 'Goa', country: 'India', full: 'Goa, India' },
  { city: 'Bangalore', country: 'India', full: 'Bangalore, India' },
  { city: 'Chennai', country: 'India', full: 'Chennai, India' },
  { city: 'Kolkata', country: 'India', full: 'Kolkata, India' },
  { city: 'Hyderabad', country: 'India', full: 'Hyderabad, India' },
  { city: 'Udaipur', country: 'India', full: 'Udaipur, India' },
  { city: 'Varanasi', country: 'India', full: 'Varanasi, India' },
  { city: 'Kochi', country: 'India', full: 'Kochi, India' },
  { city: 'Amritsar', country: 'India', full: 'Amritsar, India' },
  { city: 'Kathmandu', country: 'Nepal', full: 'Kathmandu, Nepal' },
  { city: 'Pokhara', country: 'Nepal', full: 'Pokhara, Nepal' },
  { city: 'Colombo', country: 'Sri Lanka', full: 'Colombo, Sri Lanka' },
  { city: 'Kandy', country: 'Sri Lanka', full: 'Kandy, Sri Lanka' },
  { city: 'Dhaka', country: 'Bangladesh', full: 'Dhaka, Bangladesh' },
  { city: 'Lahore', country: 'Pakistan', full: 'Lahore, Pakistan' },
  { city: 'Karachi', country: 'Pakistan', full: 'Karachi, Pakistan' },
  { city: 'Islamabad', country: 'Pakistan', full: 'Islamabad, Pakistan' },
  { city: 'Male', country: 'Maldives', full: 'Maldives' },
  // Central Asia & Caucasus
  { city: 'Tbilisi', country: 'Georgia', full: 'Tbilisi, Georgia' },
  { city: 'Yerevan', country: 'Armenia', full: 'Yerevan, Armenia' },
  { city: 'Baku', country: 'Azerbaijan', full: 'Baku, Azerbaijan' },
  { city: 'Almaty', country: 'Kazakhstan', full: 'Almaty, Kazakhstan' },
  { city: 'Tashkent', country: 'Uzbekistan', full: 'Tashkent, Uzbekistan' },
  { city: 'Samarkand', country: 'Uzbekistan', full: 'Samarkand, Uzbekistan' },
  { city: 'Bukhara', country: 'Uzbekistan', full: 'Bukhara, Uzbekistan' },
  // Middle East
  { city: 'Dubai', country: 'UAE', full: 'Dubai, UAE' },
  { city: 'Abu Dhabi', country: 'UAE', full: 'Abu Dhabi, UAE' },
  { city: 'Doha', country: 'Qatar', full: 'Doha, Qatar' },
  { city: 'Muscat', country: 'Oman', full: 'Muscat, Oman' },
  { city: 'Riyadh', country: 'Saudi Arabia', full: 'Riyadh, Saudi Arabia' },
  { city: 'Jeddah', country: 'Saudi Arabia', full: 'Jeddah, Saudi Arabia' },
  { city: 'Kuwait City', country: 'Kuwait', full: 'Kuwait City, Kuwait' },
  { city: 'Manama', country: 'Bahrain', full: 'Manama, Bahrain' },
  { city: 'Amman', country: 'Jordan', full: 'Amman, Jordan' },
  { city: 'Petra', country: 'Jordan', full: 'Petra, Jordan' },
  { city: 'Beirut', country: 'Lebanon', full: 'Beirut, Lebanon' },
  { city: 'Jerusalem', country: 'Israel', full: 'Jerusalem, Israel' },
  { city: 'Tel Aviv', country: 'Israel', full: 'Tel Aviv, Israel' },
  { city: 'Istanbul', country: 'Turkey', full: 'Istanbul, Turkey' },
  { city: 'Cappadocia', country: 'Turkey', full: 'Cappadocia, Turkey' },
  { city: 'Antalya', country: 'Turkey', full: 'Antalya, Turkey' },
  { city: 'Bodrum', country: 'Turkey', full: 'Bodrum, Turkey' },
  { city: 'Nicosia', country: 'Cyprus', full: 'Nicosia, Cyprus' },
  { city: 'Paphos', country: 'Cyprus', full: 'Paphos, Cyprus' },
  // Africa
  { city: 'Cairo', country: 'Egypt', full: 'Cairo, Egypt' },
  { city: 'Luxor', country: 'Egypt', full: 'Luxor, Egypt' },
  { city: 'Aswan', country: 'Egypt', full: 'Aswan, Egypt' },
  { city: 'Alexandria', country: 'Egypt', full: 'Alexandria, Egypt' },
  { city: 'Marrakech', country: 'Morocco', full: 'Marrakech, Morocco' },
  { city: 'Fez', country: 'Morocco', full: 'Fez, Morocco' },
  { city: 'Casablanca', country: 'Morocco', full: 'Casablanca, Morocco' },
  { city: 'Tangier', country: 'Morocco', full: 'Tangier, Morocco' },
  { city: 'Tunis', country: 'Tunisia', full: 'Tunis, Tunisia' },
  { city: 'Cape Town', country: 'South Africa', full: 'Cape Town, South Africa' },
  { city: 'Johannesburg', country: 'South Africa', full: 'Johannesburg, South Africa' },
  { city: 'Durban', country: 'South Africa', full: 'Durban, South Africa' },
  { city: 'Nairobi', country: 'Kenya', full: 'Nairobi, Kenya' },
  { city: 'Mombasa', country: 'Kenya', full: 'Mombasa, Kenya' },
  { city: 'Zanzibar', country: 'Tanzania', full: 'Zanzibar, Tanzania' },
  { city: 'Dar es Salaam', country: 'Tanzania', full: 'Dar es Salaam, Tanzania' },
  { city: 'Serengeti', country: 'Tanzania', full: 'Serengeti, Tanzania' },
  { city: 'Addis Ababa', country: 'Ethiopia', full: 'Addis Ababa, Ethiopia' },
  { city: 'Accra', country: 'Ghana', full: 'Accra, Ghana' },
  { city: 'Lagos', country: 'Nigeria', full: 'Lagos, Nigeria' },
  { city: 'Abuja', country: 'Nigeria', full: 'Abuja, Nigeria' },
  { city: 'Dakar', country: 'Senegal', full: 'Dakar, Senegal' },
  { city: 'Windhoek', country: 'Namibia', full: 'Windhoek, Namibia' },
  { city: 'Victoria Falls', country: 'Zimbabwe', full: 'Victoria Falls, Zimbabwe' },
  { city: 'Harare', country: 'Zimbabwe', full: 'Harare, Zimbabwe' },
  { city: 'Gaborone', country: 'Botswana', full: 'Gaborone, Botswana' },
  { city: 'Port Louis', country: 'Mauritius', full: 'Port Louis, Mauritius' },
  { city: 'Victoria', country: 'Seychelles', full: 'Victoria, Seychelles' },
  { city: 'Antananarivo', country: 'Madagascar', full: 'Antananarivo, Madagascar' },
  // Western Europe
  { city: 'Paris', country: 'France', full: 'Paris, France' },
  { city: 'Nice', country: 'France', full: 'Nice, France' },
  { city: 'Lyon', country: 'France', full: 'Lyon, France' },
  { city: 'Bordeaux', country: 'France', full: 'Bordeaux, France' },
  { city: 'Marseille', country: 'France', full: 'Marseille, France' },
  { city: 'Strasbourg', country: 'France', full: 'Strasbourg, France' },
  { city: 'Toulouse', country: 'France', full: 'Toulouse, France' },
  { city: 'Cannes', country: 'France', full: 'Cannes, France' },
  { city: 'Monaco', country: 'Monaco', full: 'Monaco' },
  { city: 'London', country: 'United Kingdom', full: 'London, United Kingdom' },
  { city: 'Edinburgh', country: 'United Kingdom', full: 'Edinburgh, United Kingdom' },
  { city: 'Manchester', country: 'United Kingdom', full: 'Manchester, United Kingdom' },
  { city: 'Liverpool', country: 'United Kingdom', full: 'Liverpool, United Kingdom' },
  { city: 'Bath', country: 'United Kingdom', full: 'Bath, United Kingdom' },
  { city: 'Oxford', country: 'United Kingdom', full: 'Oxford, United Kingdom' },
  { city: 'Cambridge', country: 'United Kingdom', full: 'Cambridge, United Kingdom' },
  { city: 'Dublin', country: 'Ireland', full: 'Dublin, Ireland' },
  { city: 'Galway', country: 'Ireland', full: 'Galway, Ireland' },
  { city: 'Amsterdam', country: 'Netherlands', full: 'Amsterdam, Netherlands' },
  { city: 'Rotterdam', country: 'Netherlands', full: 'Rotterdam, Netherlands' },
  { city: 'The Hague', country: 'Netherlands', full: 'The Hague, Netherlands' },
  { city: 'Brussels', country: 'Belgium', full: 'Brussels, Belgium' },
  { city: 'Bruges', country: 'Belgium', full: 'Bruges, Belgium' },
  { city: 'Ghent', country: 'Belgium', full: 'Ghent, Belgium' },
  { city: 'Antwerp', country: 'Belgium', full: 'Antwerp, Belgium' },
  { city: 'Zurich', country: 'Switzerland', full: 'Zurich, Switzerland' },
  { city: 'Geneva', country: 'Switzerland', full: 'Geneva, Switzerland' },
  { city: 'Bern', country: 'Switzerland', full: 'Bern, Switzerland' },
  { city: 'Interlaken', country: 'Switzerland', full: 'Interlaken, Switzerland' },
  { city: 'Lucerne', country: 'Switzerland', full: 'Lucerne, Switzerland' },
  { city: 'Vienna', country: 'Austria', full: 'Vienna, Austria' },
  { city: 'Salzburg', country: 'Austria', full: 'Salzburg, Austria' },
  { city: 'Innsbruck', country: 'Austria', full: 'Innsbruck, Austria' },
  { city: 'Berlin', country: 'Germany', full: 'Berlin, Germany' },
  { city: 'Munich', country: 'Germany', full: 'Munich, Germany' },
  { city: 'Hamburg', country: 'Germany', full: 'Hamburg, Germany' },
  { city: 'Frankfurt', country: 'Germany', full: 'Frankfurt, Germany' },
  { city: 'Cologne', country: 'Germany', full: 'Cologne, Germany' },
  { city: 'Dresden', country: 'Germany', full: 'Dresden, Germany' },
  { city: 'Heidelberg', country: 'Germany', full: 'Heidelberg, Germany' },
  { city: 'Rothenburg', country: 'Germany', full: 'Rothenburg, Germany' },
  { city: 'Lisbon', country: 'Portugal', full: 'Lisbon, Portugal' },
  { city: 'Porto', country: 'Portugal', full: 'Porto, Portugal' },
  { city: 'Algarve', country: 'Portugal', full: 'Algarve, Portugal' },
  { city: 'Madeira', country: 'Portugal', full: 'Madeira, Portugal' },
  { city: 'Madrid', country: 'Spain', full: 'Madrid, Spain' },
  { city: 'Barcelona', country: 'Spain', full: 'Barcelona, Spain' },
  { city: 'Seville', country: 'Spain', full: 'Seville, Spain' },
  { city: 'Valencia', country: 'Spain', full: 'Valencia, Spain' },
  { city: 'Bilbao', country: 'Spain', full: 'Bilbao, Spain' },
  { city: 'San Sebastian', country: 'Spain', full: 'San Sebastian, Spain' },
  { city: 'Granada', country: 'Spain', full: 'Granada, Spain' },
  { city: 'Palma', country: 'Spain', full: 'Palma, Mallorca, Spain' },
  { city: 'Ibiza', country: 'Spain', full: 'Ibiza, Spain' },
  { city: 'Tenerife', country: 'Spain', full: 'Tenerife, Spain' },
  // Southern Europe
  { city: 'Rome', country: 'Italy', full: 'Rome, Italy' },
  { city: 'Florence', country: 'Italy', full: 'Florence, Italy' },
  { city: 'Venice', country: 'Italy', full: 'Venice, Italy' },
  { city: 'Milan', country: 'Italy', full: 'Milan, Italy' },
  { city: 'Naples', country: 'Italy', full: 'Naples, Italy' },
  { city: 'Amalfi Coast', country: 'Italy', full: 'Amalfi Coast, Italy' },
  { city: 'Cinque Terre', country: 'Italy', full: 'Cinque Terre, Italy' },
  { city: 'Tuscany', country: 'Italy', full: 'Tuscany, Italy' },
  { city: 'Sicily', country: 'Italy', full: 'Sicily, Italy' },
  { city: 'Sardinia', country: 'Italy', full: 'Sardinia, Italy' },
  { city: 'Bologna', country: 'Italy', full: 'Bologna, Italy' },
  { city: 'Verona', country: 'Italy', full: 'Verona, Italy' },
  { city: 'Turin', country: 'Italy', full: 'Turin, Italy' },
  { city: 'Athens', country: 'Greece', full: 'Athens, Greece' },
  { city: 'Santorini', country: 'Greece', full: 'Santorini, Greece' },
  { city: 'Mykonos', country: 'Greece', full: 'Mykonos, Greece' },
  { city: 'Crete', country: 'Greece', full: 'Crete, Greece' },
  { city: 'Rhodes', country: 'Greece', full: 'Rhodes, Greece' },
  { city: 'Corfu', country: 'Greece', full: 'Corfu, Greece' },
  { city: 'Thessaloniki', country: 'Greece', full: 'Thessaloniki, Greece' },
  { city: 'Dubrovnik', country: 'Croatia', full: 'Dubrovnik, Croatia' },
  { city: 'Split', country: 'Croatia', full: 'Split, Croatia' },
  { city: 'Zagreb', country: 'Croatia', full: 'Zagreb, Croatia' },
  { city: 'Hvar', country: 'Croatia', full: 'Hvar, Croatia' },
  { city: 'Ljubljana', country: 'Slovenia', full: 'Ljubljana, Slovenia' },
  { city: 'Bled', country: 'Slovenia', full: 'Bled, Slovenia' },
  { city: 'Sarajevo', country: 'Bosnia', full: 'Sarajevo, Bosnia and Herzegovina' },
  { city: 'Kotor', country: 'Montenegro', full: 'Kotor, Montenegro' },
  { city: 'Belgrade', country: 'Serbia', full: 'Belgrade, Serbia' },
  { city: 'Sofia', country: 'Bulgaria', full: 'Sofia, Bulgaria' },
  { city: 'Bucharest', country: 'Romania', full: 'Bucharest, Romania' },
  { city: 'Valletta', country: 'Malta', full: 'Valletta, Malta' },
  // Northern & Eastern Europe
  { city: 'Copenhagen', country: 'Denmark', full: 'Copenhagen, Denmark' },
  { city: 'Stockholm', country: 'Sweden', full: 'Stockholm, Sweden' },
  { city: 'Oslo', country: 'Norway', full: 'Oslo, Norway' },
  { city: 'Bergen', country: 'Norway', full: 'Bergen, Norway' },
  { city: 'Helsinki', country: 'Finland', full: 'Helsinki, Finland' },
  { city: 'Reykjavik', country: 'Iceland', full: 'Reykjavik, Iceland' },
  { city: 'Tallinn', country: 'Estonia', full: 'Tallinn, Estonia' },
  { city: 'Riga', country: 'Latvia', full: 'Riga, Latvia' },
  { city: 'Vilnius', country: 'Lithuania', full: 'Vilnius, Lithuania' },
  { city: 'Prague', country: 'Czech Republic', full: 'Prague, Czech Republic' },
  { city: 'Budapest', country: 'Hungary', full: 'Budapest, Hungary' },
  { city: 'Warsaw', country: 'Poland', full: 'Warsaw, Poland' },
  { city: 'Krakow', country: 'Poland', full: 'Krakow, Poland' },
  { city: 'Gdansk', country: 'Poland', full: 'Gdansk, Poland' },
  { city: 'Bratislava', country: 'Slovakia', full: 'Bratislava, Slovakia' },
  { city: 'Lviv', country: 'Ukraine', full: 'Lviv, Ukraine' },
  { city: 'Kyiv', country: 'Ukraine', full: 'Kyiv, Ukraine' },
  { city: 'Moscow', country: 'Russia', full: 'Moscow, Russia' },
  { city: 'St. Petersburg', country: 'Russia', full: 'St. Petersburg, Russia' },
  // North America
  { city: 'New York', country: 'USA', full: 'New York, USA' },
  { city: 'Los Angeles', country: 'USA', full: 'Los Angeles, USA' },
  { city: 'Chicago', country: 'USA', full: 'Chicago, USA' },
  { city: 'San Francisco', country: 'USA', full: 'San Francisco, USA' },
  { city: 'Las Vegas', country: 'USA', full: 'Las Vegas, USA' },
  { city: 'Miami', country: 'USA', full: 'Miami, USA' },
  { city: 'Boston', country: 'USA', full: 'Boston, USA' },
  { city: 'Seattle', country: 'USA', full: 'Seattle, USA' },
  { city: 'Washington DC', country: 'USA', full: 'Washington DC, USA' },
  { city: 'New Orleans', country: 'USA', full: 'New Orleans, USA' },
  { city: 'Nashville', country: 'USA', full: 'Nashville, USA' },
  { city: 'Austin', country: 'USA', full: 'Austin, USA' },
  { city: 'Denver', country: 'USA', full: 'Denver, USA' },
  { city: 'Portland', country: 'USA', full: 'Portland, USA' },
  { city: 'San Diego', country: 'USA', full: 'San Diego, USA' },
  { city: 'Honolulu', country: 'USA', full: 'Honolulu, USA' },
  { city: 'Atlanta', country: 'USA', full: 'Atlanta, USA' },
  { city: 'Philadelphia', country: 'USA', full: 'Philadelphia, USA' },
  { city: 'Phoenix', country: 'USA', full: 'Phoenix, USA' },
  { city: 'Salt Lake City', country: 'USA', full: 'Salt Lake City, USA' },
  { city: 'Sedona', country: 'USA', full: 'Sedona, USA' },
  { city: 'Grand Canyon', country: 'USA', full: 'Grand Canyon, USA' },
  { city: 'Toronto', country: 'Canada', full: 'Toronto, Canada' },
  { city: 'Vancouver', country: 'Canada', full: 'Vancouver, Canada' },
  { city: 'Montreal', country: 'Canada', full: 'Montreal, Canada' },
  { city: 'Quebec City', country: 'Canada', full: 'Quebec City, Canada' },
  { city: 'Calgary', country: 'Canada', full: 'Calgary, Canada' },
  { city: 'Ottawa', country: 'Canada', full: 'Ottawa, Canada' },
  { city: 'Halifax', country: 'Canada', full: 'Halifax, Canada' },
  { city: 'Banff', country: 'Canada', full: 'Banff, Canada' },
  { city: 'Mexico City', country: 'Mexico', full: 'Mexico City, Mexico' },
  { city: 'Cancun', country: 'Mexico', full: 'Cancun, Mexico' },
  { city: 'Tulum', country: 'Mexico', full: 'Tulum, Mexico' },
  { city: 'Playa del Carmen', country: 'Mexico', full: 'Playa del Carmen, Mexico' },
  { city: 'Oaxaca', country: 'Mexico', full: 'Oaxaca, Mexico' },
  { city: 'Guadalajara', country: 'Mexico', full: 'Guadalajara, Mexico' },
  { city: 'San Miguel de Allende', country: 'Mexico', full: 'San Miguel de Allende, Mexico' },
  { city: 'Merida', country: 'Mexico', full: 'Merida, Mexico' },
  { city: 'Havana', country: 'Cuba', full: 'Havana, Cuba' },
  { city: 'San José', country: 'Costa Rica', full: 'San José, Costa Rica' },
  { city: 'Panama City', country: 'Panama', full: 'Panama City, Panama' },
  { city: 'Guatemala City', country: 'Guatemala', full: 'Guatemala City, Guatemala' },
  { city: 'Nassau', country: 'Bahamas', full: 'Nassau, Bahamas' },
  { city: 'Kingston', country: 'Jamaica', full: 'Kingston, Jamaica' },
  { city: 'Montego Bay', country: 'Jamaica', full: 'Montego Bay, Jamaica' },
  { city: 'San Juan', country: 'Puerto Rico', full: 'San Juan, Puerto Rico' },
  // South America
  { city: 'Rio de Janeiro', country: 'Brazil', full: 'Rio de Janeiro, Brazil' },
  { city: 'São Paulo', country: 'Brazil', full: 'São Paulo, Brazil' },
  { city: 'Salvador', country: 'Brazil', full: 'Salvador, Brazil' },
  { city: 'Florianópolis', country: 'Brazil', full: 'Florianópolis, Brazil' },
  { city: 'Iguazu Falls', country: 'Brazil', full: 'Iguazu Falls, Brazil' },
  { city: 'Manaus', country: 'Brazil', full: 'Manaus, Brazil' },
  { city: 'Buenos Aires', country: 'Argentina', full: 'Buenos Aires, Argentina' },
  { city: 'Patagonia', country: 'Argentina', full: 'Patagonia, Argentina' },
  { city: 'Mendoza', country: 'Argentina', full: 'Mendoza, Argentina' },
  { city: 'Santiago', country: 'Chile', full: 'Santiago, Chile' },
  { city: 'Valparaíso', country: 'Chile', full: 'Valparaíso, Chile' },
  { city: 'Easter Island', country: 'Chile', full: 'Easter Island, Chile' },
  { city: 'Lima', country: 'Peru', full: 'Lima, Peru' },
  { city: 'Cusco', country: 'Peru', full: 'Cusco, Peru' },
  { city: 'Machu Picchu', country: 'Peru', full: 'Machu Picchu, Peru' },
  { city: 'Bogotá', country: 'Colombia', full: 'Bogotá, Colombia' },
  { city: 'Medellín', country: 'Colombia', full: 'Medellín, Colombia' },
  { city: 'Cartagena', country: 'Colombia', full: 'Cartagena, Colombia' },
  { city: 'Quito', country: 'Ecuador', full: 'Quito, Ecuador' },
  { city: 'Galápagos', country: 'Ecuador', full: 'Galápagos, Ecuador' },
  { city: 'La Paz', country: 'Bolivia', full: 'La Paz, Bolivia' },
  { city: 'Montevideo', country: 'Uruguay', full: 'Montevideo, Uruguay' },
  { city: 'Punta del Este', country: 'Uruguay', full: 'Punta del Este, Uruguay' },
  { city: 'Caracas', country: 'Venezuela', full: 'Caracas, Venezuela' },
  // Oceania
  { city: 'Sydney', country: 'Australia', full: 'Sydney, Australia' },
  { city: 'Melbourne', country: 'Australia', full: 'Melbourne, Australia' },
  { city: 'Brisbane', country: 'Australia', full: 'Brisbane, Australia' },
  { city: 'Perth', country: 'Australia', full: 'Perth, Australia' },
  { city: 'Gold Coast', country: 'Australia', full: 'Gold Coast, Australia' },
  { city: 'Cairns', country: 'Australia', full: 'Cairns, Australia' },
  { city: 'Adelaide', country: 'Australia', full: 'Adelaide, Australia' },
  { city: 'Hobart', country: 'Australia', full: 'Hobart, Australia' },
  { city: 'Auckland', country: 'New Zealand', full: 'Auckland, New Zealand' },
  { city: 'Wellington', country: 'New Zealand', full: 'Wellington, New Zealand' },
  { city: 'Queenstown', country: 'New Zealand', full: 'Queenstown, New Zealand' },
  { city: 'Christchurch', country: 'New Zealand', full: 'Christchurch, New Zealand' },
  { city: 'Rotorua', country: 'New Zealand', full: 'Rotorua, New Zealand' },
  { city: 'Fiji', country: 'Fiji', full: 'Nadi, Fiji' },
  { city: 'Bora Bora', country: 'French Polynesia', full: 'Bora Bora, French Polynesia' },
  { city: 'Tahiti', country: 'French Polynesia', full: 'Tahiti, French Polynesia' },
  { city: 'Samoa', country: 'Samoa', full: 'Apia, Samoa' },
  { city: 'Vanuatu', country: 'Vanuatu', full: 'Port Vila, Vanuatu' },
  { city: 'Palau', country: 'Palau', full: 'Palau' },
];

interface DashboardProps {
  session: any;
  onLogout: () => void;
  onViewItinerary: (id: string) => void;
}

export function Dashboard({ session, onLogout, onViewItinerary }: DashboardProps) {
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [savingChanges, setSavingChanges] = useState(false);
  const [newItinerary, setNewItinerary] = useState({
    location: '',
    base: '',
    days: '3',
  });
  const [locationSuggestions, setLocationSuggestions] = useState<typeof POPULAR_DESTINATIONS>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [baseSuggestions, setBaseSuggestions] = useState<string[]>([]);
  const [showBaseSuggestions, setShowBaseSuggestions] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedPace, setSelectedPace] = useState<'leisurely' | 'balanced' | 'immersive'>('balanced');
  const locationInputRef = useRef<HTMLInputElement>(null);
  const baseInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchItineraries();
  }, []);

  const fetchItineraries = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/itineraries`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Reverse order so newest itineraries appear first
        const sorted = (data.itineraries || []).sort((a: any, b: any) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setItineraries(sorted);
      }
    } catch (error) {
      console.error('Failed to fetch itineraries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (value: string) => {
    setNewItinerary({ ...newItinerary, location: value });

    if (value.length > 0) {
      const filtered = POPULAR_DESTINATIONS.filter(dest =>
        dest.full.toLowerCase().includes(value.toLowerCase()) ||
        dest.city.toLowerCase().includes(value.toLowerCase())
      );
      setLocationSuggestions(filtered.slice(0, 5));
      setShowLocationSuggestions(true);
    } else {
      setShowLocationSuggestions(false);
    }
  };

  const handleLocationSelect = (location: string) => {
    setNewItinerary({ ...newItinerary, location });
    setShowLocationSuggestions(false);
  };

  const handleBaseChange = (value: string) => {
    setNewItinerary({ ...newItinerary, base: value });

    if (newItinerary.location) {
      const locationName = newItinerary.location.split(',')[0].trim();
      const suggestions = getNeighborhoodSuggestions(locationName, value);
      setBaseSuggestions(suggestions);
      setShowBaseSuggestions(suggestions.length > 0);
    } else {
      setShowBaseSuggestions(false);
    }
  };

  const handleBaseSelect = (base: string) => {
    setNewItinerary({ ...newItinerary, base });
    setShowBaseSuggestions(false);
  };

  const getNeighborhoodSuggestions = (city: string, input: string): string[] => {
    const neighborhoods: Record<string, string[]> = {
      'Tokyo': ['Shibuya', 'Shinjuku', 'Asakusa', 'Ginza', 'Roppongi', 'Akihabara', 'Harajuku', 'Shiodome'],
      'Paris': ['Le Marais', 'Latin Quarter', 'Montmartre', 'Saint-Germain-des-Prés', 'Champs-Élysées', 'Opéra', 'Bastille'],
      'London': ['Soho', 'Covent Garden', 'Westminster', 'Camden', 'Shoreditch', 'Kensington', 'Notting Hill', 'South Bank'],
      'New York': ['Midtown', 'Brooklyn', 'Greenwich Village', 'SoHo', 'Upper East Side', 'Lower East Side', 'Williamsburg'],
      'Barcelona': ['Gothic Quarter', 'El Born', 'Eixample', 'Gràcia', 'Barceloneta', 'Poble Sec', 'Sarrià'],
      'Rome': ['Trastevere', 'Centro Storico', 'Monti', 'Prati', 'Testaccio', 'Aventino', 'Parioli'],
      'Dubai': ['Downtown Dubai', 'Old Dubai', 'JBR', 'Dubai Marina', 'Deira', 'Jumeirah', 'Palm Jumeirah'],
      'Singapore': ['Marina Bay', 'Chinatown', 'Little India', 'Orchard Road', 'Clarke Quay', 'Sentosa', 'Bugis'],
      'Bangkok': ['Sukhumvit', 'Silom', 'Old City (Rattanakosin)', 'Ari', 'Riverside', 'Siam', 'Chatuchak'],
      'Istanbul': ['Sultanahmet', 'Beyoğlu', 'Karaköy', 'Beşiktaş', 'Kadıköy', 'Galata', 'Ortaköy'],
      'Seoul': ['Gangnam', 'Hongdae', 'Itaewon', 'Insadong', 'Myeongdong', 'Bukchon', 'Mapo'],
      'Amsterdam': ['Jordaan', 'De Pijp', 'Canal Ring', 'Museum Quarter', 'Oud-Zuid', 'Waterlooplein'],
      'Hong Kong': ['Kowloon', 'Central', 'Wan Chai', 'Causeway Bay', 'Tsim Sha Tsui', 'Mong Kok', 'Sheung Wan'],
      'Sydney': ['CBD', 'Darling Harbour', 'Surry Hills', 'Newtown', 'Bondi', 'Manly', 'Glebe'],
      'Los Angeles': ['Hollywood', 'Santa Monica', 'Venice Beach', 'Downtown', 'Silver Lake', 'Westwood', 'Malibu'],
      'Venice': ['San Marco', 'Dorsoduro', 'Cannaregio', 'Castello', 'Santa Croce', 'San Polo'],
      'Prague': ['Old Town', 'Malá Strana', 'Vinohrady', 'Žižkov', 'Holešovice', 'New Town'],
      'Vienna': ['Innere Stadt', 'Mariahilf', 'Naschmarkt Area', 'Prater', 'Josefstadt', 'Neubau'],
      'Madrid': ['Sol & Gran Vía', 'Malasaña', 'La Latina', 'Lavapiés', 'Salamanca', 'Chueca', 'Retiro'],
      'Berlin': ['Mitte', 'Kreuzberg', 'Friedrichshain', 'Prenzlauer Berg', 'Charlottenburg', 'Neukölln'],
      'Lisbon': ['Alfama', 'Bairro Alto', 'Chiado', 'Baixa', 'Belém', 'LX Factory Area', 'Mouraria'],
      'San Francisco': ['Union Square', 'Mission District', 'Haight-Ashbury', 'North Beach', "Fisherman's Wharf", 'SoMa'],
      'Miami': ['South Beach', 'Wynwood', 'Little Havana', 'Downtown', 'Brickell', 'Coconut Grove'],
      'Bali': ['Seminyak', 'Ubud', 'Canggu', 'Kuta', 'Nusa Dua', 'Sanur', 'Jimbaran'],
      'Kyoto': ['Gion', 'Arashiyama', 'Fushimi', 'Higashiyama', 'Downtown Kyoto', 'Philosopher\'s Path'],
      'Florence': ['Historic Centre', 'Oltrarno', 'Santa Croce', 'San Marco', 'Brozzi'],
      'Santorini': ['Oia', 'Fira', 'Imerovigli', 'Akrotiri', 'Perivolos', 'Kamari'],
      'Cancun': ['Hotel Zone', 'Downtown', 'Puerto Morelos', 'Isla Mujeres'],
      'Phuket': ['Patong', 'Kata', 'Karon', 'Old Town', 'Rawai', 'Kamala', 'Nai Harn'],
      'Maldives': ['North Malé Atoll', 'South Malé Atoll', 'Ari Atoll', 'Baa Atoll'],
      'Athens': ['Plaka', 'Monastiraki', 'Syntagma', 'Kolonaki', 'Psiri', 'Koukaki', 'Exarcheia'],
      'Chicago': ['Loop', 'River North', 'Wicker Park', 'Lincoln Park', 'Hyde Park', 'Pilsen'],
      'Las Vegas': ['The Strip', 'Fremont Street', 'Downtown', 'Henderson', 'Summerlin'],
      'Boston': ['Beacon Hill', 'Back Bay', 'North End', 'South End', 'Cambridge', 'Fenway'],
      'Seattle': ['Capitol Hill', 'Fremont', 'Belltown', 'Pioneer Square', 'Queen Anne', 'Ballard'],
      'Melbourne': ['CBD', 'Fitzroy', 'St. Kilda', 'Collingwood', 'Carlton', 'South Yarra', 'Brunswick'],
      'Toronto': ['Downtown', 'Kensington Market', 'Queen West', 'Distillery District', 'Yorkville', 'The Annex'],
      'Vancouver': ['Downtown', 'Gastown', 'Yaletown', 'Kitsilano', 'Commercial Drive', 'Mount Pleasant'],
      'Montreal': ['Plateau-Mont-Royal', 'Old Montreal', 'Mile End', 'Downtown', 'Rosemont', 'NDG'],
      'Osaka': ['Namba', 'Shinsaibashi', 'Umeda', 'Dotonbori', 'Tennoji', 'Shinsekai', 'Nakazakicho'],
      'Shanghai': ['The Bund', 'French Concession', 'Xintiandi', 'Old City', 'Jing\'an', 'Pudong', 'Tianzifang'],
      'Beijing': ['Sanlitun', 'Hutong District', 'Wangfujing', '798 Art District', 'Chaoyang', 'Nanluoguxiang'],
      'Taipei': ['Ximending', 'Da\'an', 'Zhongshan', 'Xinyi', 'Tianmu', 'Gongguan'],
      'Kuala Lumpur': ['KLCC', 'Bukit Bintang', 'Bangsar', 'Chinatown', 'Masjid India', 'Chow Kit'],
      'Ho Chi Minh City': ['District 1', 'Ben Thanh', 'Thao Dien', 'Bui Vien', 'District 3'],
      'Hanoi': ['Old Quarter', 'Hoan Kiem', 'Tay Ho', 'Ba Dinh', 'French Quarter'],
      'Mumbai': ['Colaba', 'Bandra', 'Fort', 'Juhu', 'Andheri', 'Worli', 'Lower Parel'],
      'Delhi': ['Connaught Place', 'Hauz Khas', 'Old Delhi', 'Lajpat Nagar', 'Khan Market', 'Paharganj'],
      'Jaipur': ['Pink City', 'Civil Lines', 'Bani Park', 'Vaishali Nagar', 'Malviya Nagar'],
      'Cairo': ['Zamalek', 'Garden City', 'Old Cairo', 'Heliopolis', 'Mohandeseen', 'Dokki'],
      'Marrakech': ['Medina', 'Gueliz', 'Hivernage', 'Palmeraie', 'Sidi Ghanem'],
      'Cape Town': ['City Bowl', 'Green Point', 'V&A Waterfront', 'Sea Point', 'Bo-Kaap', 'Gardens'],
      'Rio de Janeiro': ['Ipanema', 'Copacabana', 'Leblon', 'Lapa', 'Santa Teresa', 'Botafogo', 'Barra'],
      'Buenos Aires': ['Palermo', 'San Telmo', 'Recoleta', 'Puerto Madero', 'Belgrano', 'Congreso'],
      'Lima': ['Miraflores', 'Barranco', 'San Isidro', 'Surco', 'Chorrillos'],
      'Mexico City': ['Condesa', 'Roma', 'Polanco', 'Coyoacán', 'Centro Histórico', 'Xochimilco'],
      'Reykjavik': ['Old Harbour', '101 Reykjavik', 'Laugardalur', 'Grandi', 'Hafnarfjörður'],
      'Copenhagen': ['Nørrebro', 'Vesterbro', 'Frederiksberg', 'Christianshavn', 'Østerbro', 'Inner City'],
      'Stockholm': ['Gamla Stan', 'Södermalm', 'Östermalm', 'Vasastan', 'Djurgården', 'Kungsholmen'],
      'Oslo': ['Aker Brygge', 'Grünerløkka', 'Frogner', 'Bygdøy', 'Majorstuen'],
      'Helsinki': ['Kamppi', 'Kallio', 'Design District', 'Töölö', 'Kruununhaka', 'Ullanlinna'],
      'Dublin': ['Temple Bar', 'Grafton Street', 'Docklands', 'Portobello', 'Ranelagh', 'Ballsbridge'],
      'Edinburgh': ['Old Town', 'New Town', 'Leith', 'Stockbridge', 'Morningside', 'Grassmarket'],
      'Brussels': ['Grand Place', 'Ixelles', 'Saint-Gilles', 'Schaerbeek', 'Molenbeek'],
      'Zurich': ['Altstadt', 'Zürich West', 'Seefeld', 'Niederdorf', 'Langstrasse'],
      'Geneva': ['Old Town', 'Eaux-Vives', 'Carouge', 'Plainpalais', 'Champel', 'Pâquis'],
      'Monaco': ['Monte Carlo', 'La Condamine', 'Fontvieille', 'Moneghetti'],
      'Nice': ['Old Town', 'Promenade des Anglais', 'Cimiez', 'Le Port', 'Garibaldi'],
      'Lyon': ['Vieux-Lyon', 'Presqu\'île', 'Croix-Rousse', 'Confluence', 'Part-Dieu'],
      'Milan': ['Brera', 'Navigli', 'Porta Romana', 'Isola', 'Garibaldi', 'Duomo', 'Porta Venezia'],
      'Naples': ['Historic Centre', 'Spaccanapoli', 'Chiaia', 'Vomero', 'Posillipo'],
      'Seville': ['Santa Cruz', 'Triana', 'El Centro', 'La Macarena', 'Los Remedios', 'Nervión'],
      'Valencia': ['Old Town', 'Ruzafa', 'El Cabanyal', 'Benicalap', 'Malva-rosa'],
      'Porto': ['Ribeira', 'Miragaia', 'Bonfim', 'Cedofeita', 'Massarelos'],
      'Krakow': ['Old Town', 'Kazimierz', 'Podgórze', 'Krowodrza', 'Dębniki'],
      'Budapest': ['Buda Castle', 'Jewish Quarter', 'Víziváros', 'Belváros', 'Erzsébetváros'],
      'Warsaw': ['Old Town', 'Praga', 'Mokotów', 'Żoliborz', 'Wola'],
      'Jerusalem': ['Old City', 'West Jerusalem', 'Mahane Yehuda', 'German Colony', 'Ein Kerem'],
      'Tel Aviv': ['Florentin', 'Neve Tzedek', 'Rothschild Boulevard', 'The Port', 'Dizengoff', 'Old North'],
      'Doha': ['West Bay', 'The Pearl', 'Souq Waqif', 'Al Sadd', 'Katara'],
      'Abu Dhabi': ['Downtown', 'Corniche', 'Yas Island', 'Al Maryah Island', 'Saadiyat Island'],
    };

    const genericAreas = [
      'City Center', 'Old Town', 'Downtown', 'Waterfront', 'Historic District',
      'Arts Quarter', 'Business District', 'University Area', 'Harbour Area', 'Market District',
    ];

    const cityNeighborhoods = neighborhoods[city] || genericAreas;
    return cityNeighborhoods.filter(n => !input || n.toLowerCase().includes(input.toLowerCase())).slice(0, 6);
  };

  const handleCreateItinerary = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dateRange.from || !dateRange.to) {
      alert('Please select your travel dates');
      return;
    }

    if (isCreating) return; // Prevent duplicate submissions

    setIsCreating(true);
    const title = `Trip to ${newItinerary.location.split(',')[0]}`;

    // Calculate days from date range
    let days = parseInt(newItinerary.days);
    let startDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
    let endDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

    if (dateRange.from && dateRange.to) {
      days = differenceInDays(dateRange.to, dateRange.from) + 1;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/itineraries`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            location: newItinerary.location,
            base: newItinerary.base,
            title,
            area: '',
            days: days.toString(),
            startDate,
            endDate,
            interests: selectedInterests,
            travelStyle: 'balanced',
            pace: selectedPace,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        await generatePlan(data.itinerary.id);
        setCreateDialogOpen(false);
        setNewItinerary({ location: '', base: '', days: '3' });
        setDateRange({ from: undefined, to: undefined });
        setCreateStep(1);
        setSelectedInterests([]);
        setSelectedPace('balanced');
        fetchItineraries();
      } else {
        alert(data.error || 'Failed to create itinerary');
      }
    } catch (error) {
      console.error('Failed to create itinerary:', error);
      alert('Failed to create itinerary. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAdvanceStep = () => {
    if (!newItinerary.location) { alert('Please enter a destination'); return; }
    if (!newItinerary.base) { alert('Please enter where you\'re staying'); return; }
    if (!dateRange.from || !dateRange.to) { alert('Please select your travel dates'); return; }
    setCreateStep(2);
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const generatePlan = async (itineraryId: string) => {
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/itineraries/${itineraryId}/generate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );
    } catch (error) {
      console.error('Failed to generate plan:', error);
    }
  };

  const handleDeleteItinerary = async (itineraryId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this itinerary?')) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/itineraries/${itineraryId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        fetchItineraries();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete itinerary');
      }
    } catch (error) {
      console.error('Failed to delete itinerary:', error);
      alert('Failed to delete itinerary');
    }
  };

  const handleClearAllItineraries = async () => {
    if (!confirm('Are you sure you want to delete ALL itineraries? This action cannot be undone.')) {
      return;
    }

    try {
      const deletePromises = itineraries.map(itinerary =>
        fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/itineraries/${itinerary.id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        )
      );

      await Promise.all(deletePromises);
      fetchItineraries();
    } catch (error) {
      console.error('Failed to clear itineraries:', error);
      alert('Failed to clear all itineraries');
    }
  };

  const handleSaveUsername = async () => {
    if (!newUsername || newUsername === userName) {
      setEditingUsername(false);
      return;
    }

    setSavingChanges(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/account/username`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ username: newUsername }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        session.user.user_metadata.username = newUsername;
        setEditingUsername(false);
        alert('Username updated successfully!');
      } else {
        alert(data.error || 'Failed to update username');
      }
    } catch (error) {
      console.error('Failed to update username:', error);
      alert('Failed to update username');
    } finally {
      setSavingChanges(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!newEmail || newEmail === session.user.email) {
      setEditingEmail(false);
      return;
    }

    setSavingChanges(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/account/email`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ email: newEmail }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setEditingEmail(false);
        alert('Email update initiated! Check both your old and new email for confirmation.');
      } else {
        alert(data.error || 'Failed to update email');
      }
    } catch (error) {
      console.error('Failed to update email:', error);
      alert('Failed to update email');
    } finally {
      setSavingChanges(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt(
      'Are you ABSOLUTELY sure you want to delete your account? This will permanently delete all your itineraries and data. Type "DELETE" to confirm:'
    );

    if (confirmation !== 'DELETE') {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865/account`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        alert('Your account has been deleted.');
        onLogout();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Failed to delete account');
    }
  };

  const userName = session.user.user_metadata?.username || 'user';

  return (
    <div className="size-full">
      <header
        className="relative border-b border-white/10 shadow-lg overflow-hidden"
        style={{ backgroundImage: `url(${headerImg})`, backgroundSize: 'cover', backgroundPosition: 'center 30%' }}
      >
        <div className="absolute inset-0 bg-slate-900/70" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <img src={logoImg} alt="WhereTwo" className="h-12 w-auto drop-shadow-md" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-white hover:bg-white/10 gap-2 border border-white/20 rounded-full px-4">
                <UserCircle className="w-5 h-5" />
                @{userName}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">@{userName}</p>
                  <p className="text-xs text-muted-foreground">{session.user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSettingsDialogOpen(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Your Itineraries</h2>
            <p className="text-sm text-muted-foreground mt-1">Plan your next adventure</p>
          </div>
          <div className="flex gap-2">
            {itineraries.length > 0 && (
              <Button
                variant="outline"
                onClick={handleClearAllItineraries}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            )}
            <Dialog open={createDialogOpen} onOpenChange={(open) => {
              if (!isCreating) {
                setCreateDialogOpen(open);
                if (!open) {
                  setNewItinerary({ location: '', base: '', days: '3' });
                  setDateRange({ from: undefined, to: undefined });
                  setCreateStep(1);
                  setSelectedInterests([]);
                  setSelectedPace('balanced');
                }
              }
            }}>
              <DialogTrigger asChild>
                <Button className="shadow-md hover:shadow-lg transition-shadow">
                  <Plus className="w-4 h-4 mr-2" />
                  New Itinerary
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Plan Your Trip</DialogTitle>
                <DialogDescription>
                  {createStep === 1 ? 'Tell us where you\'re going and when.' : 'Personalize your experience.'}
                </DialogDescription>
              </DialogHeader>

              {/* Step indicator */}
              <div className="flex items-center gap-2 -mt-1 mb-1">
                <div className={`h-1 flex-1 rounded-full ${createStep >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                <div className={`h-1 flex-1 rounded-full ${createStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
              </div>

              <form onSubmit={handleCreateItinerary}>
                {createStep === 1 ? (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-base">Where are you going?</Label>
                      <div className="relative">
                        <Input
                          ref={locationInputRef}
                          id="location"
                          value={newItinerary.location}
                          onChange={(e) => handleLocationChange(e.target.value)}
                          onFocus={() => {
                            if (newItinerary.location) setShowLocationSuggestions(true);
                          }}
                          onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                          disabled={isCreating}
                          placeholder="Type any city..."
                          className="text-base"
                        />
                        {showLocationSuggestions && locationSuggestions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                            {locationSuggestions.map((dest, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => handleLocationSelect(dest.full)}
                                className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100 last:border-0"
                              >
                                <MapPin className="w-4 h-4 text-slate-400" />
                                <div>
                                  <div className="font-medium text-slate-900">{dest.city}</div>
                                  <div className="text-xs text-slate-500">{dest.country}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">You can type any city in the world</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="base" className="text-base">Where are you staying?</Label>
                      <div className="relative">
                        <Input
                          ref={baseInputRef}
                          id="base"
                          value={newItinerary.base}
                          onChange={(e) => handleBaseChange(e.target.value)}
                          onFocus={() => {
                            if (newItinerary.location) {
                              const locationName = newItinerary.location.split(',')[0].trim();
                              const suggestions = getNeighborhoodSuggestions(locationName, newItinerary.base);
                              setBaseSuggestions(suggestions);
                              setShowBaseSuggestions(suggestions.length > 0);
                            }
                          }}
                          onBlur={() => setTimeout(() => setShowBaseSuggestions(false), 200)}
                          disabled={isCreating}
                          placeholder="Neighborhood or hotel area"
                          className="text-base"
                        />
                        {showBaseSuggestions && baseSuggestions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-auto">
                            {baseSuggestions.map((neighborhood, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => handleBaseSelect(neighborhood)}
                                className="w-full px-4 py-2.5 text-left hover:bg-slate-50 text-slate-900 border-b border-slate-100 last:border-0"
                              >
                                {neighborhood}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">This helps us plan activities nearby</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base">When are you traveling?</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-start text-left font-normal h-11 ${
                              !dateRange.from && 'text-muted-foreground'
                            }`}
                            disabled={isCreating}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.from ? (
                              dateRange.to ? (
                                <>
                                  {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    ({differenceInDays(dateRange.to, dateRange.from) + 1} days)
                                  </span>
                                </>
                              ) : (
                                format(dateRange.from, 'LLL dd, y')
                              )
                            ) : (
                              <span>Pick your travel dates</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange.from}
                            selected={dateRange}
                            onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                            numberOfMonths={1}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          />
                        </PopoverContent>
                      </Popover>
                      <p className="text-xs text-slate-500">Select your check-in and check-out dates</p>
                    </div>

                    <Button type="button" className="w-full h-11 text-base" onClick={handleAdvanceStep}>
                      Continue
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-base">What experiences interest you?</Label>
                        <p className="text-xs text-slate-500 mt-1">Select all that apply — your itinerary will be tailored accordingly.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {ACTIVITY_INTERESTS.map((interest) => {
                          const selected = selectedInterests.includes(interest.id);
                          return (
                            <button
                              key={interest.id}
                              type="button"
                              onClick={() => toggleInterest(interest.id)}
                              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all text-left ${
                                selected
                                  ? 'border-primary bg-primary/5 text-primary'
                                  : 'border-border text-foreground hover:border-primary/40 hover:bg-muted/50'
                              }`}
                            >
                              <span>{interest.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base">How would you like to pace your days?</Label>
                      <div className="space-y-2">
                        {PACE_OPTIONS.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setSelectedPace(option.id as 'leisurely' | 'balanced' | 'immersive')}
                            className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                              selectedPace === option.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/40 hover:bg-muted/50'
                            }`}
                          >
                            <div className={`font-semibold text-sm ${selectedPace === option.id ? 'text-primary' : 'text-foreground'}`}>{option.label}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{option.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setCreateStep(1)} className="gap-1.5" disabled={isCreating}>
                        <ArrowLeft className="w-4 h-4" />
                        Back
                      </Button>
                      <Button type="submit" className="flex-1 h-11 text-base" disabled={isCreating}>
                        {isCreating ? (
                          <>
                            <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></div>
                            Creating your trip...
                          </>
                        ) : (
                          'Generate Itinerary'
                        )}
                      </Button>
                    </div>
                    {isCreating && (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Our AI is planning your perfect trip...</p>
                        <p className="text-xs text-muted-foreground mt-1">This may take up to 30 seconds</p>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </DialogContent>
          </Dialog>
          </div>

          <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Account Settings</DialogTitle>
                <DialogDescription>
                  Manage your account information and preferences
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Username</Label>
                    {editingUsername ? (
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          placeholder="wheretwo-user-0"
                          disabled={savingChanges}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleSaveUsername}
                          disabled={savingChanges}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingUsername(false);
                            setNewUsername('');
                          }}
                          disabled={savingChanges}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-base font-semibold">@{userName}</p>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingUsername(true);
                            setNewUsername(userName);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    {editingEmail ? (
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="you@example.com"
                          disabled={savingChanges}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleSaveEmail}
                          disabled={savingChanges}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingEmail(false);
                            setNewEmail('');
                          }}
                          disabled={savingChanges}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-base font-semibold">{session.user.email}</p>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingEmail(true);
                            setNewEmail(session.user.email || '');
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Danger Zone</h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                      <h4 className="text-sm font-semibold text-destructive mb-2">Delete Account</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteAccount}
                        className="w-full"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading your trips...</p>
          </div>
        ) : itineraries.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="max-w-md mx-auto">
              <MapPin className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No trips yet</h3>
              <p className="text-muted-foreground mb-6">Start planning your next adventure by creating your first itinerary!</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Trip
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {itineraries.map((itinerary) => (
              <Card key={itinerary.id} className="cursor-pointer hover:shadow-xl transition-all duration-200 hover:-translate-y-1 border-2 hover:border-primary/20" onClick={() => onViewItinerary(itinerary.id)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-foreground">{itinerary.title}</CardTitle>
                      <CardDescription className="flex items-center gap-1.5 mt-2 text-base">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="font-medium">{itinerary.location}</span>
                        {itinerary.area && ` - ${itinerary.area}`}
                      </CardDescription>
                      {itinerary.base && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary"></span>
                          Staying in {itinerary.base}
                        </p>
                      )}
                    </div>
                    {itinerary.ownerId === session.user.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 -mt-2"
                        onClick={(e) => handleDeleteItinerary(itinerary.id, e)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-foreground/70">
                      <div className="bg-primary/10 p-1.5 rounded-md">
                        <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      {itinerary.startDate && itinerary.endDate ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-xs">
                            {format(new Date(itinerary.startDate), 'MMM d')} - {format(new Date(itinerary.endDate), 'MMM d, yyyy')}
                          </span>
                          <span className="text-xs text-muted-foreground">{itinerary.days} days</span>
                        </div>
                      ) : (
                        <span className="font-medium">{itinerary.days} days</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-foreground/70">
                      <div className="bg-secondary/10 p-1.5 rounded-md">
                        <Users className="w-3.5 h-3.5 text-secondary" />
                      </div>
                      <span className="font-medium">{itinerary.collaborators.length + 1}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      itinerary.ownerId === session.user.id
                        ? 'bg-primary/10 text-primary'
                        : 'bg-secondary/10 text-secondary'
                    }`}>
                      {itinerary.ownerId === session.user.id ? 'Owner' : 'Collaborator'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}