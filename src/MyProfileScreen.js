import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ScrollView, Alert, Modal, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useLanguage } from './LanguageContext';

// Paste your STATE_CITY_DATA here
const STATE_CITY_DATA = {
  // Your state and city data goes here
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

export default function MyProfileScreen() {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const user = auth().currentUser;

  const [name, setName] = useState('');
  const [stateName, setStateName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [availableCities, setAvailableCities] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        if (!user) return;
        const doc = await firestore().collection('users').doc(user.uid).get();
        if (doc.exists) {
          const d = doc.data() || {};
          setName(d.name || '');
          setStateName(d.state || '');
          setCity(d.city || '');
          setAddress(d.address || '');
        }
      } catch (e) {
        console.log('Profile load error', e);
      }
    };
    load();
  }, [user]);

  // Update available cities when state changes
  useEffect(() => {
    if (stateName && STATE_CITY_DATA[stateName]) {
      setAvailableCities(STATE_CITY_DATA[stateName]);
    } else {
      setAvailableCities([]);
    }
  }, [stateName]);

  const handleStateSelect = (state) => {
    setStateName(state);
    setCity(''); // Reset city when state changes
    setShowStateModal(false);
  };

  const handleCitySelect = (selectedCity) => {
    setCity(selectedCity);
    setShowCityModal(false);
  };

  const handleSave = async () => {
    if (!user) {
      Alert.alert(t('error'), t('userNotLoggedIn'));
      return;
    }

    // Validate required fields
    if (!name || !name.trim()) {
      Alert.alert(t('validationError'), t('pleaseEnterName'));
      return;
    }

    setSaving(true);
    try {
      // Check if firestore is available
      if (!firestore || typeof firestore !== 'function') {
        throw new Error('Firestore is not available. Please check your Firebase configuration.');
      }

      // Verify user is still authenticated
      const currentUser = auth().currentUser;
      if (!currentUser || currentUser.uid !== user.uid) {
        throw new Error('User session expired. Please login again.');
      }

      const userRef = firestore().collection('users').doc(user.uid);
      
      // Prepare timestamp - use the correct FieldValue API
      let timestamp;
      try {
        // Try the correct React Native Firebase pattern
        if (firestore.FieldValue && typeof firestore.FieldValue.serverTimestamp === 'function') {
          timestamp = firestore.FieldValue.serverTimestamp();
        } else if (firestore().FieldValue && typeof firestore().FieldValue.serverTimestamp === 'function') {
          timestamp = firestore().FieldValue.serverTimestamp();
        } else {
          // Fallback to Date.now() if FieldValue is not available
          timestamp = Date.now();
        }
      } catch (e) {
        console.warn('Could not use serverTimestamp, using Date.now()', e);
        timestamp = Date.now();
      }
      
      // Prepare data with proper types
      const profileData = {
        name: name.trim(),
        state: stateName || '',
        city: city || '',
        address: address || '',
        phone: user.phoneNumber || '',
        updatedAt: timestamp,
      };

      // Try to save
      await userRef.set(profileData, { merge: true });
      
      Alert.alert(t('saved'), t('profileUpdated'));
      navigation.goBack();
    } catch (e) {
      console.error('Save error:', e);
      console.error('Error code:', e?.code);
      console.error('Error message:', e?.message);
      
      // Provide more specific error messages
      let errorMessage = t('failedToSaveProfile');
      let errorTitle = t('error');
      
      if (e?.code === 'permission-denied') {
        errorTitle = t('permissionDenied');
        errorMessage = 'Your Firestore security rules are blocking this operation.\n\n' +
          'Please update your Firestore rules in Firebase Console:\n' +
          '1. Go to Firebase Console → Firestore Database → Rules\n' +
          '2. Add rule: allow read, write: if request.auth != null && request.auth.uid == userId;\n' +
          '3. Publish the rules\n\n' +
          'Or contact your administrator to fix the security rules.';
      } else if (e?.code === 'unavailable') {
        errorTitle = t('networkError');
        errorMessage = t('networkError');
      } else if (e?.code === 'deadline-exceeded') {
        errorTitle = t('timeout');
        errorMessage = t('timeout');
      } else if (e?.code === 'unauthenticated') {
        errorTitle = t('authenticationError');
        errorMessage = t('youAreNotLoggedIn');
      } else if (e?.message) {
        errorMessage = `Error: ${e.message}`;
      }
      
      Alert.alert(errorTitle, errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Render State Selection Modal
  const renderStateModal = () => (
    <Modal
      visible={showStateModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowStateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('selectStateUT')}</Text>
            <TouchableOpacity onPress={() => setShowStateModal(false)}>
              <Ionicons name="close" size={24} color="#333333" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={Object.keys(STATE_CITY_DATA).sort()}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  stateName === item && styles.modalItemSelected
                ]}
                onPress={() => handleStateSelect(item)}
              >
                <Text style={[
                  styles.modalItemText,
                  stateName === item && styles.modalItemTextSelected
                ]}>
                  {item}
                </Text>
                {stateName === item && (
                  <Ionicons name="checkmark" size={20} color="#0e7c36" />
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
      visible={showCityModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCityModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {t('selectCityState').replace('{state}', stateName)}
            </Text>
            <TouchableOpacity onPress={() => setShowCityModal(false)}>
              <Ionicons name="close" size={24} color="#333333" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={availableCities}
            keyExtractor={(item, index) => `${item}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  city === item && styles.modalItemSelected
                ]}
                onPress={() => handleCitySelect(item)}
              >
                <Text style={[
                  styles.modalItemText,
                  city === item && styles.modalItemTextSelected
                ]}>
                  {item}
                </Text>
                {city === item && (
                  <Ionicons name="checkmark" size={20} color="#0e7c36" />
                )}
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={true}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('myProfile')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={[styles.input, styles.readonlyInput, styles.centeredInput]}>
            <Text style={[styles.readonlyText, { textAlign: 'center' }]}>{user?.phoneNumber || 'Not available'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('name')}</Text>
          <TextInput value={name} onChangeText={setName} placeholder={t('name')} style={styles.input} />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('state')}</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowStateModal(true)}
          >
            <Text style={[styles.dropdownText, !stateName && styles.placeholderText]}>
              {stateName || t('selectState')}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#666666" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('city')}</Text>
          <TouchableOpacity
            style={[styles.dropdown, !stateName && styles.dropdownDisabled]}
            onPress={() => stateName && setShowCityModal(true)}
            disabled={!stateName}
          >
            <Text style={[styles.dropdownText, !city && styles.placeholderText, !stateName && styles.disabledText]}>
              {city || t('selectCity')}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#666666" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('address')}</Text>
          <TextInput value={address} onChangeText={setAddress} placeholder={t('address')} style={[styles.input, { height: 90, textAlignVertical: 'top' }]} multiline />
        </View>

        <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.6 }]} disabled={saving} onPress={handleSave}>
          <Text style={styles.saveText}>{saving ? t('loading') : t('save')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modals */}
      {renderStateModal()}
      {renderCityModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  content: { padding: 16 },
  section: { marginBottom: 16 },
  label: { fontSize: 14, color: '#374151', marginBottom: 8, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },
  centeredInput: { justifyContent: 'center' },
  readonlyInput: { backgroundColor: '#F9FAFB' },
  readonlyText: { color: '#6B7280', fontSize: 16 },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: '#FFFFFF',
  },
  dropdownDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  dropdownText: {
    fontSize: 16,
    color: '#111827',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  disabledText: {
    color: '#D1D5DB',
  },
  saveButton: {
    backgroundColor: '#0e7c36',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
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
    color: '#0e7c36',
    fontWeight: '600',
  },
});