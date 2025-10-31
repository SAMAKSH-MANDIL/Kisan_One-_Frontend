import React, { useState, useEffect } from 'react';
import { Country, State, City } from 'country-state-city';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Linking,
  Alert,
  TextInput,
  Modal,
  FlatList
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

export default function InfoScreen() {

  const [countries, setcountries] = useState(Country.getAllCountries);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [selectedCountry, setSelectedCountry] = useState(null);


  const [activeSection, setActiveSection] = useState('Mandi Price');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [schemeCategory, setSchemeCategory] = useState('Central');
  const [showStateInput, setShowStateInput] = useState(false);
  const [showCityInput, setShowCityInput] = useState(false);

  const sections = ['Mandi Price', 'Schemes', 'Latest Update'];
  // Complete India States and Cities Data
  const indiaStatesAndCities = {
    "Andhra Pradesh": [
  "Adoni", "Amaravati", "Anantapur", "Atmakur", "Bapatla", "Bhimavaram", "Bobbili", "Chilakaluripet", "Chirala", "Chittoor",
  "Dharmavaram", "Eluru", "Guntur", "Guntakal", "Gudivada", "Hindupur", "Jaggaiahpet", "Jammalamadugu", "Kadapa", "Kakinada",
  "Kandukur", "Kavali", "Kovvur", "Kurnool", "Machilipatnam", "Macherla", "Madanapalle", "Mangalagiri", "Markapur", "Nandyal",
  "Narasapuram", "Narasaraopet", "Nellore", "Ongole", "Palakollu", "Palasa", "Peddapuram", "Pithapuram", "Ponnur", "Proddatur",
  "Punganur", "Puttur", "Rajahmundry", "Rajampet", "Ramachandrapuram", "Rayachoti", "Rayadurg", "Repalle", "Salur", "Sattenapalle",
  "Srikakulam", "Srikalahasti", "Sullurpeta", "Tanuku", "Tadepalligudem", "Tadipatri", "Tenali", "Tirupati", "Venkatagiri", "Vijayawada",
  "Vinukonda", "Visakhapatnam", "Vizianagaram", "Vuyyuru"
],

    "Arunachal Pradesh": [
  "Along", "Anini", "Basar", "Bomdila", "Changlang", "Daporijo", "Itanagar", "Jairampur", "Khonsa", "Mechuka",
  "Naharlagun", "Namsai", "Pasighat", "Roing", "Seppa", "Tali", "Tawang", "Tezu", "Yingkiong", "Ziro"
],

    "Assam": [
  "Amguri", "Barpeta", "Bijni", "Bilasipara", "Biswanath Chariali", "Bokajan", "Bongaigaon", "Chapar", "Dhekiajuli", "Dhubri",
  "Digboi", "Dibrugarh", "Diphu", "Duliajan", "Gauripur", "Goalpara", "Golakganj", "Golaghat", "Guwahati", "Haflong",
  "Hailakandi", "Hojai", "Jorhat", "Karimganj", "Kokrajhar", "Lumding", "Makum", "Mangaldoi", "Mariani", "Margherita",
  "Marigaon", "Morigaon", "Namrup", "Nagaon", "Nalbari", "Nazira", "North Lakhimpur", "Rangia", "Sapatgram", "Sarupathar",
  "Sibsagar", "Sivasagar", "Silchar", "Sonari", "Sorbhog", "Tezpur", "Tihu", "Tinsukia"
],

    "Bihar": [
  "Araria", "Arrah", "Aurangabad", "Bagaha", "Banka", "Barh", "Begusarai", "Bettiah", "Bhagalpur", "Bhabua",
  "Bihar Sharif", "Biharsharif", "Buxar", "Chhapra", "Danapur", "Darbhanga", "Dehri", "Dumraon", "Gaya", "Gopalganj",
  "Hajipur", "Harnaut", "Hilsa", "Jamalpur", "Jamui", "Jehanabad", "Katihar", "Khagaria", "Kishanganj", "Madhubani",
  "Madhepura", "Masaurhi", "Mokama", "Motihari", "Munger", "Muzaffarpur", "Narkatiaganj", "Nawada", "Patna", "Purnia",
  "Raxaul", "Saharsa", "Samastipur", "Sasaram", "Sheikhpura", "Sheohar", "Siwan", "Sitamarhi", "Supaul", "Teghra"
],

    "Chhattisgarh": [
  "Ambikapur", "Arang", "Balod", "Basna", "Bemetara", "Bhatapara", "Bhilai", "Bilaspur", "Champa", "Chirmiri",
  "Dhamtari", "Dongargaon", "Dongargarh", "Durg", "Jagdalpur", "Janjgir", "Katghora", "Kanker", "Kawardha", "Khairagarh",
  "Kharsia", "Korba", "Kurud", "Lormi", "Mahasamund", "Manendragarh", "Mungeli", "Naila Janjgir", "Patan", "Pathalgaon",
  "Pithora", "Raigarh", "Raipur", "Rajnandgaon", "Ratanpur", "Sakti", "Sarangarh", "Simga", "Takhatpur", "Tilda"
],

    "Goa": [
  "Aldona", "Anjuna", "Arambol", "Benaulim", "Bicholim", "Calangute", "Candolim", "Canacona", "Chapora", "Colva",
  "Cortalim", "Cuncolim", "Curchorem", "Dona Paula", "Mapusa", "Margao", "Miramar", "Morjim", "Panaji", "Pernem",
  "Ponda", "Quepem", "Reis Magos", "Saligao", "Sanquelim", "Siolim", "Valpoi", "Vagator", "Vasco da Gama"
],

   "Gujarat": [
  "Ahmedabad", "Amreli", "Anand", "Ankleshwar", "Bardoli", "Bharuch", "Bhavnagar", "Bhuj", "Botad", "Dahod",
  "Deesa", "Dholka", "Dhoraji", "Gandhidham", "Gandhinagar", "Godhra", "Gondal", "Jetpur", "Junagadh", "Kadi",
  "Kalol", "Khambhat", "Mahesana", "Mahuva", "Mangrol", "Mehsana", "Modasa", "Morbi", "Morvi", "Nadiad",
  "Navsari", "Palanpur", "Patan", "Porbandar", "Rajkot", "Surat", "Surendranagar", "Valsad", "Vapi", "Veraval",
  "Viramgam", "Visnagar", "Vyara", "Wankaner"
],

    "Haryana": [
  "Ambala", "Bahadurgarh", "Bhiwani", "Charkhi Dadri", "Fatehabad", "Faridabad", "Gohana", "Gurgaon", "Hansi", "Hisar",
  "Jakhal", "Jind", "Jhajjar", "Kaithal", "Karnal", "Ladwa", "Mahendragarh", "Mandi Dabwali", "Narnaul", "Narwana",
  "Nissing", "Palwal", "Panchkula", "Panipat", "Pehowa", "Pinjore", "Ratia", "Rewari", "Rohtak", "Sadhaura",
  "Safidon", "Samalkha", "Shahbad", "Sirsa", "Sohna", "Sonipat", "Taraori", "Thanesar", "Tohana", "Yamunanagar"
],

"Himachal Pradesh": [
  "Amb", "Arki", "Baddi", "Bakloh", "Bilaspur", "Chamba", "Chirgaon", "Chopal", "Dalhousie", "Dharamshala",
  "Gagret", "Hamirpur", "Jogindernagar", "Jubbal", "Kalpa", "Kangra", "Kasauli", "Kaza", "Keylong", "Kullu",
  "Manali", "Mandi", "Nahan", "Nalagarh", "Narkanda", "Nurpur", "Palampur", "Paonta Sahib", "Parwanoo", "Rajgarh",
  "Rampur", "Rekong Peo", "Rohru", "Sarahan", "Shimla", "Solan", "Spiti", "Sundernagar", "Theog", "Una"
],
"Jharkhand": [
  "Adityapur", "Bistupur", "Bokaro", "Bundu", "Chaibasa", "Chakradharpur", "Chas", "Chatra", "Chirkunda", "Deoghar",
  "Dhanbad", "Dumka", "Garhwa", "Ghatshila", "Giridih", "Godda", "Golmuri", "Gomia", "Gumia", "Hazaribagh",
  "Jamshedpur", "Jamtara", "Jharia", "Jugsalai", "Khunti", "Koderma", "Lohardaga", "Madhupur", "Manoharpur", "Medininagar",
  "Mihijam", "Pakur", "Phusro", "Rajmahal", "Ramgarh", "Ranchi", "Sahibganj", "Saunda", "Simdega", "Sindri"
],
"Karnataka": [
  "Arsikere", "Athani", "Bagalkot", "Ballari", "Belagavi", "Bellary", "Bengaluru", "Bhadravati", "Bidar", "Bijapur",
  "Channapatna", "Chikmagalur", "Chitradurga", "Davanagere", "Gadag", "Gangavati", "Gokak", "Harihar", "Hassan", "Haveri",
  "Hiriyur", "Hospet", "Hubballi", "Hubli", "Jamkhandi", "Karwar", "Kolar", "Kushalnagar", "Madikeri", "Mandya",
  "Mangaluru", "Mysuru", "Nanjangud", "Puttur", "Rabkavi Banhatti", "Raichur", "Ramanagara", "Ranebennur", "Robertsonpet", "Sagar",
  "Sakaleshpur", "Shimoga", "Shivamogga", "Sindhanur", "Sirsi", "Tiptur", "Tumakuru", "Udupi", "Vijayapura", "Yadgir"
],
"Kerala": [
  "Adoor", "Alappuzha", "Aluva", "Angamaly", "Attingal", "Chalakudy", "Changanassery", "Cherthala", "Ernakulam", "Ettumanoor",
  "Guruvayur", "Irinjalakuda", "Kalamassery", "Kanhangad", "Kannur", "Kasaragod", "Kayamkulam", "Kochi", "Kodungallur", "Kollam",
  "Kothamangalam", "Kottayam", "Koyilandy", "Kozhikode", "Kuttippuram", "Malappuram", "Manjeri", "Muvattupuzha", "Nedumangad", "Nilambur",
  "Ottapalam", "Pala", "Palakkad", "Pathanamthitta", "Pattambi", "Payyanur", "Perinthalmanna", "Perumbavoor", "Piravom", "Ponnani",
  "Shoranur", "Thalassery", "Thiruvananthapuram", "Thodupuzha", "Thrippunithura", "Thrissur", "Tirur", "Vaikom", "Varkala", "Vatakara"
],
"Madhya Pradesh": [
  "Ashok Nagar", "Badnagar", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh",
  "Datia", "Dewas", "Dhar", "Gadarwara", "Guna", "Gwalior", "Harda", "Hoshangabad", "Indore", "Itarsi",
  "Jabalpur", "Khargone", "Khilchipur", "Khandwa", "Mahidpur", "Maihar", "Mandla", "Mandsaur", "Morena", "Murwara",
  "Nagda", "Narsinghpur", "Neemuch", "Pithampur", "Raisen", "Ratlam", "Rewa", "Sagar", "Sarni", "Satna",
  "Sehore", "Sendhwa", "Seoni", "Shahdol", "Shajapur", "Shivpuri", "Singrauli", "Ujjain", "Umaria", "Vidisha"
],
"Maharashtra": [
  "Achalpur", "Ahmednagar", "Akola", "Ambajogai", "Ambarnath", "Amravati", "Aurangabad", "Badlapur", "Barshi", "Beed",
  "Bhiwandi", "Bhusawal", "Chandrapur", "Dhule", "Dombivli", "Gondia", "Hinganghat", "Ichalkaranji", "Jalgaon", "Jalna",
  "Kalyan", "Kamptee", "Kolhapur", "Latur", "Lonavala", "Malegaon", "Mira-Bhayandar", "Mumbai", "Nagpur", "Nanded",
  "Nandurbar", "Nashik", "Navi Mumbai", "Osmanabad", "Palghar", "Panchgani", "Panvel", "Parbhani", "Pune", "Sangli",
  "Satara", "Solapur", "Thane", "Udgir", "Ulhasnagar", "Vasai", "Virar", "Wardha", "Washim", "Yavatmal"
],
"Manipur": [
  "Andro", "Bishnupur", "Chandel", "Churachandpur", "Imphal", "Jiribam", "Kakching", "Kumbi", "Mayang Imphal", "Moirang",
  "Moreh", "Nambol", "Noney", "Senapati", "Sugnu", "Tamenglong", "Thoubal", "Ukhrul", "Wangjing", "Yairipok"
],
"Meghalaya": [
  "Ampati", "Baghmara", "Cherrapunji", "Dawki", "Jowai", "Khliehriat", "Laban", "Mairang", "Mawkyrwat", "Mawlai",
  "Mawsynram", "Nongpoh", "Nongstoin", "Nongthymmai", "Pynursla", "Ranikor", "Resubelpara", "Shillong", "Tura", "Williamnagar"
],
"Mizoram": [
  "Aizawl", "Bunghmun", "Champhai", "Darlawn", "Hnahlan", "Hnahthial", "Kawnpui", "Khawzawl", "Kolasib", "Lawngtlai",
  "Lunglei", "Mamit", "North Vanlaiphai", "Saiha", "Saitual", "Serchhip", "Thenzawl", "Tlabung", "Vairengte", "Zawlnuam"
],
"Nagaland": [
  "Changtongya", "Chumukedima", "Dimapur", "Jalukie", "Kiphire", "Kohima", "Longleng", "Medziphema", "Mokokchung", "Mon",
  "Noklak", "Peren", "Pfutsero", "Phek", "Tizit", "Tseminyu", "Tuensang", "Tuli", "Wokha", "Zunheboto"
],
"Odisha": [
  "Angul", "Athagarh", "Balangir", "Balasore", "Barbil", "Bargarh", "Baripada", "Berhampur", "Bhadrak", "Bhanjanagar",
  "Bhawanipatna", "Bhubaneswar", "Chandbali", "Cuttack", "Dhenkanal", "Gunupur", "Jajpur", "Jatani", "Jeypore", "Jharsuguda",
  "Kantabanji", "Kendrapara", "Khordha", "Koraput", "Malkangiri", "Nabarangpur", "Nayagarh", "Nuapada", "Paradip", "Parlakhemundi",
  "Phulbani", "Puri", "Rayagada", "Rourkela", "Sambalpur", "Sonepur", "Sunabeda", "Talcher", "Titlagarh", "Khallikote"
],
"Punjab": [
  "Abohar", "Amritsar", "Barnala", "Bathinda", "Chandigarh", "Dhuri", "Faridkot", "Fazilka", "Firozpur", "Gobindgarh",
  "Gurdaspur", "Hoshiarpur", "Jagraon", "Jalandhar", "Kapurthala", "Khanna", "Kharar", "Kotkapura", "Ludhiana", "Malerkotla",
  "Malout", "Mansa", "Moga", "Mohali", "Morinda", "Muktsar", "Nabha", "Nangal", "Nawanshahr", "Pathankot",
  "Patiala", "Phagwara", "Rajpura", "Rupnagar", "Samrala", "Sangrur", "Sunam", "Talwandi Sabo", "Tarn Taran", "Zira"
],
"Rajasthan": [
  "Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Beawar", "Bharatpur", "Bhilwara", "Bikaner", "Bundi",
  "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Fatehpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jhalawar",
  "Jhunjhunu", "Jodhpur", "Karauli", "Kishangarh", "Kota", "Makrana", "Mount Abu", "Nagaur", "Nathdwara", "Nimaj",
  "Pali", "Pratapgarh", "Pushkar", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"
],
"Sikkim": [
  "Chungthang", "Gangtok", "Gyalshing", "Jorethang", "Lachen", "Lachung", "Majitar", "Mangan", "Melli", "Namchi",
  "Nayabazar", "Pakyong", "Pelling", "Rangpo", "Ravangla", "Rinchenpong", "Rongli", "Singtam", "Soreng", "Yuksom"
],
"Tamil Nadu": [
  "Ambattur", "Ambur", "Arakkonam", "Ariyalur", "Avadi", "Chennai", "Chidambaram", "Coimbatore", "Cuddalore", "Dharmapuri",
  "Dindigul", "Erode", "Gudiyatham", "Hosur", "Kanchipuram", "Kanyakumari", "Karaikudi", "Karur", "Kumbakonam", "Madurai",
  "Mayiladuthurai", "Nagercoil", "Nagapattinam", "Neyveli", "Pallavaram", "Perambalur", "Pollachi", "Pudukkottai", "Rajapalayam", "Ranipet",
  "Salem", "Sivakasi", "Tambaram", "Thanjavur", "Theni", "Thoothukudi", "Tindivanam", "Tiruchirappalli", "Tirunelveli", "Tiruppur",
  "Tiruvallur", "Tiruvannamalai", "Udhagamandalam", "Vaniyambadi", "Vellore", "Villupuram", "Virudhunagar"
],
"Telangana": [
  "Adilabad", "Armoor", "Bellampalle", "Bhongir", "Bodhan", "Gadwal", "Ghatkesar", "Hyderabad", "Jagtial", "Jangaon",
  "Kamareddy", "Karimnagar", "Khammam", "Kodad", "Kothagudem", "Kyathanpally", "Madhira", "Mahbubnagar", "Mancherial", "Mandamarri",
  "Manuguru", "Medak", "Metpally", "Miryalaguda", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Palwancha",
  "Ramagundam", "Sangareddy", "Siddipet", "Sircilla", "Suryapet", "Tandur", "Vikarabad", "Wanaparthy", "Warangal", "Zahirabad"
],
"Tripura": [
  "Agartala", "Amarpur", "Ambassa", "Belonia", "Bishalgarh", "Dharmanagar", "Jampui Hills", "Kailasahar", "Kamalpur", "Kanchanpur",
  "Khowai", "Kumarghat", "Melaghar", "Mohanpur", "Ranirbazar", "Sabroom", "Santirbazar", "Sonamura", "Teliamura", "Udaipur"
],
"Uttar Pradesh": [
  "Agra", "Aligarh", "Allahabad", "Amroha", "Ayodhya", "Azamgarh", "Bahraich", "Banda", "Barabanki", "Bareilly",
  "Budaun", "Bulandshahr", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Ghaziabad", "Gonda",
  "Gorakhpur", "Hardoi", "Hathras", "Hapur", "Jaunpur", "Jhansi", "Kanpur", "Khurja", "Lakhimpur", "Lalitpur",
  "Lucknow", "Mainpuri", "Mathura", "Maunath Bhanjan", "Meerut", "Mirzapur", "Modinagar", "Moradabad", "Muzaffarnagar", "Noida",
  "Orai", "Pilibhit", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Shahjahanpur", "Sitapur", "Unnao", "Varanasi"
],
"Uttarakhand": [
  "Almora", "Bageshwar", "Bazpur", "Bhimtal", "Chamoli", "Champawat", "Clement Town", "Dehradun", "Didihat", "Doiwala",
  "Haldwani", "Haridwar", "Jaspur", "Joshimath", "Kashipur", "Kausani", "Kichha", "Kotdwar", "Laksar", "Lansdowne",
  "Manglaur", "Mussoorie", "Nainital", "Narendra Nagar", "Pauri", "Pithoragarh", "Raiwala", "Ramnagar", "Ranikhet", "Rishikesh",
  "Roorkee", "Rudrapur", "Sitarganj", "Srinagar", "Sultanpur", "Tanakpur", "Tehri", "Uttarkashi", "Vikasnagar", "Munsyari"
],
"West Bengal": [
  "Alipurduar", "Arambagh", "Asansol", "Balurghat", "Bankura", "Barasat", "Bardhaman", "Barrackpore", "Basirhat", "Berhampore",
  "Bhatpara", "Bidhannagar", "Bongaon", "Chandannagar", "Contai", "Cooch Behar", "Darjeeling", "Dinhata", "Durgapur", "Ghatal",
  "Haldia", "Howrah", "Jalpaiguri", "Jangipur", "Jhargram", "Kalimpong", "Kamarhati", "Kharagpur", "Kolkata", "Krishnanagar",
  "Kurseong", "Madhyamgram", "Maheshtala", "Malda", "Medinipur", "Nabadwip", "Naihati", "Panihati", "Purulia", "Raiganj",
  "Rajarhat", "Rajpur Sonarpur", "Ranaghat", "Rishra", "Serampore", "Siliguri", "Santipur", "Tamluk", "Titagarh", "Uttarpara"
],
"Andaman and Nicobar Islands": [
  "Baratang", "Campbell Bay", "Car Nicobar", "Diglipur", "Great Nicobar", "Havelock Island", "Katchal", "Little Andaman", "Long Island", "Mayabunder",
  "Nancowry", "Neil Island", "Port Blair", "Rangat", "Teressa"
],
"Chandigarh": ["Chandigarh"],
"Dadra and Nagar Haveli and Daman and Diu": [
  "Amli", "Daman", "Diu", "Dunetha", "Kachigam", "Khanvel", "Naroli", "Rakholi", "Samarvarni", "Silvassa"
],
"Delhi": [
  "Bawana", "Connaught Place", "Delhi", "Dwarka", "Greater Kailash", "Hauz Khas", "Janakpuri", "Kalkaji", "Karol Bagh", "Laxmi Nagar",
  "Mayur Vihar", "Mundka", "Nangloi", "Narela", "Nehru Place", "New Delhi", "Paschim Vihar", "Patel Nagar", "Pitampura", "Preet Vihar",
  "Punjabi Bagh", "Rajouri Garden", "Rohini", "Saket", "Shahdara", "Tilak Nagar", "Uttam Nagar", "Vasant Kunj"
],
"Jammu and Kashmir": [
  "Anantnag", "Awantipora", "Bandipora", "Baramulla", "Bijbehara", "Budgam", "Doda", "Ganderbal", "Gulmarg", "Handwara",
  "Jammu", "Kargil", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Leh", "Pahalgam", "Poonch", "Pulwama",
  "Rajouri", "Ramban", "Reasi", "Shopian", "Sonmarg", "Sopore", "Srinagar", "Tral", "Udhampur", "Uri"
],
"Ladakh": [
  "Alchi", "Batalik", "Diskit", "Drass", "Hemis", "Kargil", "Khalsi", "Lamayuru", "Leh", "Mulbekh",
  "Nimmu", "Nubra", "Padum", "Sankoo", "Thiksey", "Zanskar"
],
"Lakshadweep": [
  "Agatti", "Amini", "Andrott", "Bitra", "Chetlat", "Kadmat", "Kalpeni", "Kavaratti", "Kiltan", "Minicoy"
],
"Puducherry": [
  "Ariyankuppam", "Bahour", "Karaikal", "Mahe", "Mannadipet", "Nettapakkam", "Oulgaret", "Puducherry", "Villianur", "Yanam"
]
  };

  // Sample Mandi Price data
  const mandiPrices = [
    { item: 'Rice', variety: 'Basmati', minPrice: 2500, maxPrice: 2800, unit: 'Quintal' },
    { item: 'Wheat', variety: 'Whole', minPrice: 1800, maxPrice: 2100, unit: 'Quintal' },
    { item: 'Potato', variety: 'Fresh', minPrice: 1200, maxPrice: 1500, unit: 'Quintal' },
    { item: 'Tomato', variety: 'Fresh', minPrice: 3000, maxPrice: 3500, unit: 'Quintal' },
    { item: 'Onion', variety: 'Dry', minPrice: 2000, maxPrice: 2400, unit: 'Quintal' },
    { item: 'Corn', variety: 'Yellow', minPrice: 1500, maxPrice: 1800, unit: 'Quintal' },
  ];

  // Sample Schemes data
  const schemes = {
    Central: [
      { name: 'PM Kisan', desc: 'Direct Income Support to Farmers', status: 'Active' },
      { name: 'Pradhan Mantri Fasal Bima Yojana', desc: 'Crop Insurance Scheme', status: 'Active' },
      { name: 'Kisan Credit Card', desc: 'Credit Facility for Farmers', status: 'Active' },
    ],
    Government: [
      { name: 'National Food Security Mission', desc: 'Food security for farmers', status: 'Active' },
      { name: 'Rashtriya Krishi Vikas Yojana', desc: 'Agricultural Development', status: 'Active' },
      { name: 'Sub-Mission on Agricultural Mechanization', desc: 'Machinery Subsidy', status: 'Active' },
    ],
    State: [
      { name: 'State Agriculture Scheme', desc: 'Local farmer support', status: 'Active' },
      { name: 'State Irrigation Scheme', desc: 'Water management support', status: 'Active' },
      { name: 'State Crop Insurance', desc: 'State level insurance', status: 'Active' },
    ],
    Private: [
      { name: 'AgriTech Innovation Fund', desc: 'Private sector support', status: 'Active' },
      { name: 'Corporate Social Responsibility', desc: 'CSR initiatives', status: 'Active' },
      { name: 'Private Sector Loans', desc: 'Low interest loans', status: 'Active' },
    ],
  };

  // Sample Updates
  const latestUpdates = [
    { date: '2024-01-15', title: 'New Mandi Prices Updated', desc: 'Fresh price list for all commodities released' },
    { date: '2024-01-12', title: 'New Scheme Launched', desc: 'State government launches new farmer support scheme' },
    { date: '2024-01-10', title: 'Weather Alert', desc: 'Heavy rainfall expected in next 3 days' },
    { date: '2024-01-08', title: 'Seed Distribution', desc: 'Free quality seeds available at agriculture office' },
  ];
  // Get available cities for selected state
  const getAvailableCities = () => {
    if (selectedState && indiaStatesAndCities[selectedState]) {
      return indiaStatesAndCities[selectedState];
    }
    return [];
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Choose your preferred contact method',
      [
        { text: 'Call', onPress: () => Linking.openURL('tel:+919876543210') },
        { text: 'Email', onPress: () => Linking.openURL('mailto:support@kisanone.com') },
        { text: 'WhatsApp', onPress: () => Linking.openURL('https://wa.me/919876543210') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleRateApp = () => {
    Alert.alert('Rate App', 'Thank you for using KisanOne! Please rate us on the app store.');
  };

  const handleShareApp = () => {
    Alert.alert('Share App', 'Share KisanOne with your farming community!');
  };

  const handleStateSelect = (state) => {
    setSelectedState(state);
    setSelectedCity(''); // Reset city when state changes
    setShowStateInput(false);
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setShowCityInput(false);
  };
  const renderMandiPrice = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      

      <View style={styles.inputCard}>
        <View style={styles.inputHeader}>
          <MaterialIcons name="location-on" size={20} color="#2E7D32" />
          <Text style={styles.inputLabel}>Select Location</Text>
        </View>
        <View style={styles.locationRow}>
          <View style={styles.locationInput}>
            <Text style={styles.locationInputLabel}>State</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowStateInput(true)}
            >
              <Text style={styles.dropdownText}>
                {selectedState || 'Select State'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#666666" />
            </TouchableOpacity>
          </View>
          <View style={styles.locationInput}>
            <Text style={styles.locationInputLabel}>City</Text>
            <TouchableOpacity
              style={[styles.dropdown, !selectedState && styles.dropdownDisabled]}
              onPress={() => selectedState && setShowCityInput(true)}
              disabled={!selectedState}
            >
              <Text style={[styles.dropdownText, !selectedState && styles.dropdownTextDisabled]}>
                {selectedCity || 'Select City'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#666666" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.searchButton, (!selectedState || !selectedCity) && styles.searchButtonDisabled]}
          disabled={!selectedState || !selectedCity}
        >
          <MaterialIcons name="search" size={20} color="#FFFFFF" />
          <Text style={styles.searchButtonText}>Get Prices</Text>
        </TouchableOpacity>
      </View>

      {selectedState && selectedCity && (
        <>
          <View style={styles.locationInfo}>
            <MaterialIcons name="place" size={18} color="#2E7D32" />
            <Text style={styles.locationInfoText}>
              Showing prices for {selectedCity}, {selectedState}
            </Text>
          </View>

          <View style={styles.priceHeader}>
            <Text style={styles.priceHeaderText}>Commodity</Text>
            <Text style={styles.priceHeaderText}>Price (₹/Qt)</Text>
          </View>

          {mandiPrices.map((price, index) => (
            <View key={index} style={styles.priceRow}>
              <View style={styles.priceInfo}>
                <Text style={styles.priceItem}>{price.item}</Text>
                <Text style={styles.priceVariety}>{price.variety}</Text>
              </View>
              <Text style={styles.priceRange}>
                ₹{price.minPrice} - ₹{price.maxPrice}
              </Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
  // Render State Selection Modal
  const renderStateModal = () => (
    <Modal
      visible={showStateInput}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowStateInput(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select State/UT</Text>
            <TouchableOpacity onPress={() => setShowStateInput(false)}>
              <Ionicons name="close" size={24} color="#333333" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={Object.keys(indiaStatesAndCities).sort()}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  selectedState === item && styles.modalItemSelected
                ]}
                onPress={() => handleStateSelect(item)}
              >
                <Text style={[
                  styles.modalItemText,
                  selectedState === item && styles.modalItemTextSelected
                ]}>
                  {item}
                </Text>
                {selectedState === item && (
                  <Ionicons name="checkmark" size={20} color="#2E7D32" />
                )}
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={true}
          />
        </View>
      </View>
    </Modal>
  );

  // Render City Selection Modal
  const renderCityModal = () => (
    <Modal
      visible={showCityInput}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCityInput(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Select City - {selectedState}
            </Text>
            <TouchableOpacity onPress={() => setShowCityInput(false)}>
              <Ionicons name="close" size={24} color="#333333" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={getAvailableCities()}
            keyExtractor={(item, index) => `${item}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  selectedCity === item && styles.modalItemSelected
                ]}
                onPress={() => handleCitySelect(item)}
              >
                <Text style={[
                  styles.modalItemText,
                  selectedCity === item && styles.modalItemTextSelected
                ]}>
                  {item}
                </Text>
                {selectedCity === item && (
                  <Ionicons name="checkmark" size={20} color="#2E7D32" />
                )}
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={true}
          />
        </View>
      </View>
    </Modal>
  );
  const renderSchemes = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.categoryButton, schemeCategory === 'Central' && styles.categoryButtonActive]}
            onPress={() => setSchemeCategory('Central')}
          >
            <Ionicons name="business-outline" size={18} color={schemeCategory === 'Central' ? '#FFFFFF' : '#666666'} />
            <Text style={[styles.categoryButtonText, schemeCategory === 'Central' && styles.categoryButtonTextActive]}>
              Central
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.categoryButton, schemeCategory === 'Government' && styles.categoryButtonActive]}
            onPress={() => setSchemeCategory('Government')}
          >
            <Ionicons name="people-outline" size={18} color={schemeCategory === 'Government' ? '#FFFFFF' : '#666666'} />
            <Text style={[styles.categoryButtonText, schemeCategory === 'Government' && styles.categoryButtonTextActive]}>
              Government
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.categoryButton, schemeCategory === 'State' && styles.categoryButtonActive]}
            onPress={() => setSchemeCategory('State')}
          >
            <Ionicons name="location-outline" size={18} color={schemeCategory === 'State' ? '#FFFFFF' : '#666666'} />
            <Text style={[styles.categoryButtonText, schemeCategory === 'State' && styles.categoryButtonTextActive]}>
              State
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.categoryButton, schemeCategory === 'Private' && styles.categoryButtonActive]}
            onPress={() => setSchemeCategory('Private')}
          >
            <Ionicons name="briefcase-outline" size={18} color={schemeCategory === 'Private' ? '#FFFFFF' : '#666666'} />
            <Text style={[styles.categoryButtonText, schemeCategory === 'Private' && styles.categoryButtonTextActive]}>
              Private
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {schemes[schemeCategory].map((scheme, index) => (
        <TouchableOpacity key={index} style={styles.schemeCard}>
          <View style={styles.schemeIconBg}>
            <MaterialIcons name="policy" size={24} color="#2E7D32" />
          </View>
          <View style={styles.schemeContent}>
            <Text style={styles.schemeName}>{scheme.name}</Text>
            <Text style={styles.schemeDesc}>{scheme.desc}</Text>
            <View style={styles.schemeStatus}>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{scheme.status}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#999999" />
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderLatestUpdate = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.updatesHeader}>
        <MaterialIcons name="new-releases" size={24} color="#2E7D32" />
        <Text style={styles.updatesHeaderText}>Stay Updated</Text>
      </View>

      {latestUpdates.map((update, index) => (
        <TouchableOpacity key={index} style={styles.updateCard}>
          <View style={styles.updateHeader}>
            <View style={styles.updateIcon}>
              <MaterialIcons name="campaign" size={18} color="#2E7D32" />
            </View>
            <View style={styles.updateContent}>
              <View style={styles.updateDateRow}>
                <Ionicons name="calendar-outline" size={14} color="#666666" />
                <Text style={styles.updateDate}>{update.date}</Text>
              </View>
              <Text style={styles.updateTitle}>{update.title}</Text>
              <Text style={styles.updateDesc}>{update.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </View>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.viewMoreButton}>
        <Text style={styles.viewMoreText}>View All Updates</Text>
        <Ionicons name="arrow-forward" size={18} color="#2E7D32" />
      </TouchableOpacity>
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'Mandi Price': return renderMandiPrice();
      case 'Schemes': return renderSchemes();
      case 'Latest Update': return renderLatestUpdate();
      default: return renderMandiPrice();
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" translucent={false} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Info</Text>
        <Text style={styles.headerSubtitle}>App information and settings</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {sections.map((section) => (
            <TouchableOpacity
              key={section}
              style={[
                styles.tab,
                activeSection === section && styles.activeTab,
              ]}
              onPress={() => setActiveSection(section)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeSection === section && styles.activeTabText,
                ]}
              >
                {section}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>

      {/* Modals */}
      {renderStateModal()}
      {renderCityModal()}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#2E7D32',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E8F5E8',
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  activeTab: {
    backgroundColor: '#2E7D32',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsItem: {
    flex: 1,
    alignItems: 'center',
  },
  statsDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  statsNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 8,
  },
  statsLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 8,
  },
  locationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  locationInput: {
    flex: 1,
  },
  locationInputLabel: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 6,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  dropdownDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#DDDDDD',
  },
  dropdownText: {
    fontSize: 14,
    color: '#333333',
  },
  dropdownTextDisabled: {
    color: '#999999',
  },
  searchButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  searchButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  locationInfoText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  priceHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  priceInfo: {
    flex: 1,
  },
  priceItem: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  priceVariety: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  priceRange: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalItemSelected: {
    backgroundColor: '#E8F5E8',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333333',
  },
  modalItemTextSelected: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  // Category and Scheme Styles
  categoryContainer: {
    marginBottom: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    marginRight: 8,
    gap: 6,
  },
  categoryButtonActive: {
    backgroundColor: '#2E7D32',
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  schemeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  schemeIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  schemeContent: {
    flex: 1,
  },
  schemeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  schemeDesc: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 18,
  },
  schemeStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2E7D32',
  },
  // Updates Styles
  updatesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  updatesHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  updateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  updateHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  updateIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateContent: {
    flex: 1,
    marginLeft: 12,
  },
  updateDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  updateDate: {
    fontSize: 12,
    color: '#666666',
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  updateDesc: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  viewMoreButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2E7D32',
    marginTop: 12,
    gap: 8,
  },
  viewMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
});