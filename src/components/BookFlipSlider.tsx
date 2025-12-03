import { useRef, useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { autoTable, UserOptions } from 'jspdf-autotable';
import 'jspdf-autotable';
import './BookFlipSlider.css';

// Import related images for left side (content-related)
import relatedImg1 from '@/assets/images/related_1.jpg';
import relatedImg2 from '@/assets/images/related_2.jpg';
import relatedImg3 from '@/assets/images/related_3.jpg';
import relatedImg4 from '@/assets/images/related_4.jpg';
// import logoImg from '@/assets/images/logo.png'; // Logo for PDF - Uncomment this line when the logo file is added
import relatedImg5 from '@/assets/images/related_5.jpg';
import relatedImg6 from '@/assets/images/related_6.jpg';
import relatedImg7 from '@/assets/images/related_7.jpg';
import relatedImg8 from '@/assets/images/related_8.jpg';
import relatedImg9 from '@/assets/images/related_9.jpg';
import relatedImg10 from '@/assets/images/related_10.jpg';
import relatedImg11 from '@/assets/images/related_11.jpg';
import relatedImg12 from '@/assets/images/related_12.jpg';

// Extend jsPDF interface for autoTable plugin
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: UserOptions) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
  }
}
interface FormData {
  restaurantName: string;
  restaurantNumber: string;
  avgMissCallPerDay: string;
  avgOrderValue: string;
  receptionStaffSalary: string;
}

const plans = [
  { name: 'Basic', price: 900 },
  { name: 'Standard', price: 1200 },
  { name: 'Premium', price: 1800 },
];

interface PageContent {
  image: string;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
}

const BookFlipSlider = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [displayedImage, setDisplayedImage] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(14);
  const [zIndices, setZIndices] = useState<number[]>(new Array(14).fill(0));
  const [flipped, setFlipped] = useState<boolean[]>(new Array(14).fill(false));
  const [isAnimating, setIsAnimating] = useState(false);
  const zRef = useRef(1);
  const calculatorRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    restaurantName: '',
    restaurantNumber: '',
    avgMissCallPerDay: '',
    avgOrderValue: '',
    receptionStaffSalary: '',
  });
  const [selectedPlan, setSelectedPlan] = useState('Basic');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchedData, setSearchedData] = useState<FormData | null>(null);
  const [suggestions, setSuggestions] = useState<FormData[]>([]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    const existingData = localStorage.getItem('restaurantData');
    if (existingData) {
      try {
        const parsed = JSON.parse(existingData);
        if (Array.isArray(parsed)) {
          const found = parsed.find((item: FormData) =>
            item.restaurantName.toLowerCase() === searchTerm.toLowerCase()
          );
          setSearchedData(found || null);
        }
      } catch (error) {
        console.error('Error parsing localStorage data:', error);
      }
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.length > 0) {
      const existingData = localStorage.getItem('restaurantData');
      if (existingData) {
        const parsed: FormData[] = JSON.parse(existingData);
        const filtered = parsed.filter(item =>
          item.restaurantName.toLowerCase().includes(value.toLowerCase())
        );
        setSuggestions(filtered);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (data: FormData) => {
    setSearchedData(data);
    setSuggestions([]);
    setSearchTerm('');
  };

  const handleSave = () => {
    if (!formData.restaurantName) {
      alert('Please enter a restaurant name.');
      return;
    }
    const existingData = localStorage.getItem('restaurantData');
    let dataToSave: FormData[] = [];
    if (existingData) {
      try {
        dataToSave = JSON.parse(existingData);
        if (!Array.isArray(dataToSave)) dataToSave = [];
      } catch (error) {
        console.error('Error parsing localStorage data:', error);
        dataToSave = [];
      }
    }
    dataToSave.push(formData);
    localStorage.setItem('restaurantData', JSON.stringify(dataToSave));
    

    // Set the newly saved data as the current data for the calculator
    setSearchedData(formData);
    turnRight(); // Animate back to the calculator page
  };



  // Calculator calculations - use searched data if available, otherwise use form data
  const currentData = searchedData || formData;
  const planPrice = plans.find(p => p.name === selectedPlan)?.price || 900;
  const missCallPerDay = parseFloat(currentData.avgMissCallPerDay) || 0;
  const orderValue = parseFloat(currentData.avgOrderValue) || 0;
  const staffSalary = parseFloat(currentData.receptionStaffSalary) || 0;

  const monthlySalarySavings = staffSalary - planPrice;
  const monthlyBenefit = missCallPerDay * orderValue * 30;
  const totalMonthlyBenefit = monthlySalarySavings + monthlyBenefit;

  const yearlySalarySavings = (staffSalary * 12) - (planPrice * 12);
  const yearlyBenefit = missCallPerDay * orderValue * 365;
  const totalYearlyBenefit = yearlySalarySavings + yearlyBenefit;

  const monthlyBenefitPercentage = staffSalary > 0
    ? ((totalMonthlyBenefit / staffSalary) * 100).toFixed(1)
    : '0';

  const generatePdf = async (): Promise<jsPDF | null> => {
    const input = calculatorRef.current;
    if (input && currentData.restaurantName) {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;

      // Header with Logo and Company Info
      pdf.setFillColor(0, 102, 204); // Blue background
      pdf.rect(0, 0, pdfWidth, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('InfoAIOS Voice - Savings Report', margin, 15);

      // Subtitle
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('AI-Powered Restaurant Solutions', margin, 22);

      // Title
      pdf.setTextColor(0, 102, 204);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Savings Analysis for ${currentData.restaurantName}`, margin, 45);

      // Restaurant Details
      pdf.setFontSize(12);
      pdf.setTextColor(100);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Plan: ${selectedPlan} | Phone: ${currentData.restaurantNumber}`, margin, 55);
      pdf.setDrawColor(0, 102, 204);
      pdf.setLineWidth(0.5);
      pdf.line(margin, 60, pdfWidth - margin, 60);

      // Monthly Benefits Section
      pdf.setFontSize(16);
      pdf.setTextColor(0, 102, 204);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Monthly Benefits', margin, 75);
      await autoTable(pdf, {
        startY: 80,
        head: [['Category', 'Amount (₹)']],
        body: [
          ['Salary Savings', monthlySalarySavings.toLocaleString()],
          ['Missed Call Revenue', monthlyBenefit.toLocaleString()],
          [{ content: 'Total Monthly Savings', styles: { fontStyle: 'bold', fillColor: [240, 248, 255] } }, { content: totalMonthlyBenefit.toLocaleString(), styles: { fontStyle: 'bold', fillColor: [240, 248, 255] } }],
        ],
        theme: 'grid',
        styles: { cellPadding: 5, fontSize: 11, halign: 'center' },
        headStyles: { fillColor: [0, 102, 204], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: margin, right: margin },
      });

      // Yearly Benefits Section
      const finalY = pdf.lastAutoTable.finalY + 15;
      pdf.setFontSize(16);
      pdf.setTextColor(0, 102, 204);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Yearly Benefits', margin, finalY);
      await autoTable(pdf, {
        startY: finalY + 5,
        head: [['Category', 'Amount (₹)']],
        body: [
          ['Salary Savings', yearlySalarySavings.toLocaleString()],
          ['Missed Call Revenue', yearlyBenefit.toLocaleString()],
          [{ content: 'Total Yearly Savings', styles: { fontStyle: 'bold', fillColor: [240, 248, 255] } }, { content: totalYearlyBenefit.toLocaleString(), styles: { fontStyle: 'bold', fillColor: [240, 248, 255] } }],
        ],
        theme: 'grid',
        styles: { cellPadding: 5, fontSize: 11, halign: 'center' },
        headStyles: { fillColor: [0, 102, 204], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: margin, right: margin },
      });

      // ROI Percentage
      const roiY = pdf.lastAutoTable.finalY + 15;
      pdf.setFontSize(14);
      pdf.setTextColor(0, 102, 204);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Monthly Benefit vs Salary: ${monthlyBenefitPercentage}%`, margin, roiY);

      // Footer
      pdf.setFontSize(10);
      pdf.setTextColor(150);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Generated by InfoAIOS Voice - infoaios.ai', margin, pdfHeight - 10);
      
      return pdf;
    }
    return null;
  };

  const handleDownload = async () => {
    const pdf = await generatePdf();
    if (pdf) {
      pdf.save(`${currentData.restaurantName}-savings-report.pdf`);
    }
  };

  const handleWhatsAppShare = async () => {
    const restaurantName = currentData.restaurantName;
    if (!restaurantName) {
      alert('Please enter a restaurant name to generate and share the report.');
      return;
    }
    const restaurantNumber = currentData.restaurantNumber.replace(/\D/g, '');
    if (!restaurantNumber) {
      alert('Restaurant contact number is not available.');
      return;
    }
    const countryCode = '91'; // Assuming India

    // 1. Generate and download the PDF first.
    const pdf = await generatePdf();
    if (!pdf) {
      alert('Could not generate PDF. Please check the restaurant details.');
      return;
    }
    pdf.save(`${currentData.restaurantName}-savings-report.pdf`);

    // 2. Show an alert to the user to manually attach the downloaded file.
    alert("PDF report has been downloaded. Please attach it to the WhatsApp message that will open now.");

    // 3. Define the message for WhatsApp.
    const message = `Hello from InfoAIOS!
We provide an AI-powered Voice Call Assistant that helps restaurants handle calls 24/7, never missing an order again. With our Savings Calculator, discover how much you can save by automating your call handling, reducing staffing costs, and improving order accuracy. Let’s help your restaurant grow with less effort!

Please find the detailed savings report for *${restaurantName}* attached.`.trim();

    // 4. Open WhatsApp with the pre-filled message.
    const whatsappUrl = `https://wa.me/${countryCode}${restaurantNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const staticPages: PageContent[] = [
    {
      image: relatedImg1,
      title: "InfoAIOS Voice",
      subtitle: "Voice-to-Voice AI Solutions",
      content: (
        <>
          <h2>Never Miss a Call, Never Lose an Order.</h2>
          <p>SaaS-Powered AI Assistant for Seamless Customer Engagement and Order Management</p>
        </>
      )
    },
    {
      image: relatedImg2,
      title: "Bridging the Order Management Gap",
      subtitle: "Beyond POS: Addressing the Pre-Order Challenge",
      content: (
        <div className="table-content">
          <div className="table-row">
            <div className="table-col">
              <h4>Current POS Limitations</h4>
              <ul>
                <li>Handles Post-Order, Not Pre-Order</li>
                <li>Busy Lines = Missed Calls</li>
                <li>No Module Answers or Converts Callers</li>
              </ul>
            </div>
            <div className="table-col">
              <h4>InfoAIOS Voice Solution</h4>
              <ul>
                <li>24/7 AI Assistant</li>
                <li>Never Misses a Call</li>
                <li>Seamlessly Converts Inquiries into Orders</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      image: relatedImg3,
      title: "Key Features & Benefits",
      subtitle: "Voice-to-Voice AI Solutions",
      content: (
        <ul className="feature-list">
          <li>Multilingual Greetings & Interaction (Hindi, English, Gujarati)</li>
          <li>Repeats Specials & Sends WhatsApp Confirmations</li>
          <li>Takes Orders & Books Tables Instantly</li>
          <li>Zero Salary, Zero Leave, Zero Missed Call</li>
        </ul>
      )
    },
    {
      image: relatedImg4,
      title: "Precision in Every Order",
      subtitle: "InfoAIOS Voice",
      content: (
        <div className="feature-grid">
          <div className="feature-item">
            <h4>AI Voice Capture</h4>
            <p>Captures Item Name, Quantity, Customizations Verbally</p>
          </div>
          <div className="feature-item">
            <h4>Intelligent Processing</h4>
            <p>Auto-Corrects Spelling, Prices & Add-ons</p>
          </div>
          <div className="feature-item">
            <h4>Clean KOT Generation</h4>
            <p>Kitchen Receives Clean KOT, Eliminating Wrong Orders</p>
          </div>
        </div>
      )
    },
    {
      image: relatedImg5,
      title: "Maximize Efficiency",
      subtitle: "Cost-Effective AI Receptionist",
      content: (
        <div className="savings-content">
          <div className="cost-compare">
            <div className="cost-item">
              <h4>Human Receptionists</h4>
              <p>2 x ₹18k-20k/month each</p>
            </div>
            <div className="cost-item highlight">
              <h4>InfoAIOS AI Assistant</h4>
              <p>1 x ₹3.5k/month</p>
            </div>
          </div>
          <div className="savings-box">
            <h4>Total Annual Savings</h4>
            <p className="big-number">₹3,90,000 - ₹4,38,000</p>
          </div>
        </div>
      )
    },
    {
      image: relatedImg6,
      title: "Seamless CRM Integration",
      subtitle: "& Automated Marketing",
      content: (
        <div className="crm-flow">
          <div className="flow-item">
            <h4>Voice Call</h4>
            <p>Capture numbers, orders, reservations instantly</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-item">
            <h4>CRM Data</h4>
            <p>Auto-save directly to your CRM</p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-item">
            <h4>Marketing Action</h4>
            <p>Build retargeting & loyalty campaigns</p>
          </div>
        </div>
      )
    },
    {
      image: relatedImg7,
      title: "Live Café Stats",
      subtitle: "Driving Growth with AI Voice",
      content: (
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-number">1200</span>
            <span className="stat-label">Calls Handled</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">₹1.2L</span>
            <span className="stat-label">Extra Sales Generated</span>
          </div>
          <div className="stat-item highlight">
            <span className="stat-number">43x</span>
            <span className="stat-label">Return on Investment</span>
          </div>
        </div>
      )
    },
    {
      image: relatedImg8,
      title: "Transparent Pricing",
      subtitle: "Flat-Fee Model",
      content: (
        <ul className="pricing-list">
          <li><strong>No Per-Minute Charges</strong> - Single transparent monthly fee</li>
          <li><strong>Unlimited Outlets</strong> - Add all locations under one dashboard</li>
          <li><strong>Perfect for Chains</strong> - Ideal for cloud kitchens, food-court counters</li>
        </ul>
      )
    },
    {
      image: relatedImg9,
      title: "How InfoAIOS Voice Works",
      subtitle: "Simple 4-Step Process",
      content: (
        <div className="steps-list">
          <div className="step"><span>1</span> Share Prices & Menu Layout</div>
          <div className="step"><span>2</span> Choose Existing Phone</div>
          <div className="step"><span>3</span> Forward Voice Tone to Cloud Number</div>
          <div className="step"><span>4</span> AI Learns Menu - Starts Taking Calls Next Day</div>
        </div>
      )
    },
    {
      image: relatedImg10,
      title: "Seamless POS Integration",
      subtitle: "No Replacement Needed",
      content: (
        <>
          <p className="highlight-text">AI Feeds Clean Orders & Table Bookings into Your Current Petpooja POS</p>
          <div className="integration-features">
            <div>API or WhatsApp Print</div>
            <div>Preserves Existing Workflows & Hardware</div>
            <div>Effortless Setup & Synchronization</div>
          </div>
        </>
      )
    },
    {
      image: relatedImg11,
      title: "Experience Zero Missed Calls",
      subtitle: "& Boost Sales Next Week",
      content: (
        <>
          <p className="guarantee-text">If InfoAIOS Voice doesn't add ₹750k to your sales next week, walk away - no questions asked.</p>
          <div className="cta-steps">
            <div className="cta-item">Instant Signup via Mobile</div>
            <div className="cta-item">Book Onboarding Call</div>
          </div>
        </>
      )
    },
    {
      image: relatedImg12,
      title: "Transform Your Business",
      subtitle: "InfoAIOS Voice",
      content: (
        <div className="transform-grid">
          <div className="transform-item">
            <h4>PAIN</h4>
            <p>Every unanswered call is lost revenue</p>
          </div>
          <div className="transform-item">
            <h4>SOLUTION</h4>
            <p>AI-Powered Engagement</p>
          </div>
          <div className="transform-item">
            <h4>ROI</h4>
            <p>Increased Efficiency & Revenue</p>
          </div>
          <div className="transform-item highlight">
            <h4>RISK-FREE TRIAL</h4>
            <p>Start today. No commitment, just results.</p>
          </div>
        </div>
      )
    },
  ];

  // Calculator page (page 14)
  const calculatorPage: PageContent = {
    image: relatedImg5,
    title: "Your Savings Calculator",
    subtitle: currentData.restaurantName || "Results",
    content: (
      <div className="book-calculator" ref={calculatorRef}>
        {/* Search Bar */}
        <div className="calc-search">
          <Label htmlFor="searchRestaurant">Search Restaurant</Label>
          <div className="search-container" style={{ position: 'relative' }}>
            <div className="search-input-wrapper">
              <Search className="search-icon" size={16} />
              <Input
                id="searchRestaurant"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Enter restaurant name"
                autoComplete="off"
                className="search-input"
              />
              <Button onClick={handleSearch} className="search-btn">
                <Search size={14} />
                Search
              </Button>
            </div>
            {suggestions.length > 0 && (
              <ul className="suggestions-list">
                {suggestions.map((s, i) => (
                  <li key={i} onClick={() => handleSuggestionClick(s)}>
                    <Search size={12} className="suggestion-icon" />
                    {s.restaurantName}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {currentData.restaurantName && (
          <div className="calc-info">
            <span>{currentData.restaurantName}</span>
            <span>{currentData.restaurantNumber}</span>
          </div>
        )}
        
        <div className="plan-select-book">
          <Label>Select Plan</Label>
          <Select value={selectedPlan} onValueChange={setSelectedPlan}>
            <SelectTrigger>
              <SelectValue placeholder="Select a plan" />
            </SelectTrigger>
            <SelectContent>
              {plans.map(plan => (
                <SelectItem key={plan.name} value={plan.name}>
                  {plan.name} - ₹{plan.price}/mo
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="calc-results">
          <div className="calc-section">
            <h4>Monthly Benefits</h4>
            <div className="calc-row-book">
              <span>Salary Savings</span>
              <span>₹{monthlySalarySavings.toLocaleString()}</span>
            </div>
            <div className="calc-row-book">
              <span>Missed Call Revenue</span>
              <span>₹{monthlyBenefit.toLocaleString()}</span>
            </div>
            <div className="calc-total">
              <span>Total</span>
              <span>₹{totalMonthlyBenefit.toLocaleString()}</span>
            </div>
          </div>

          <div className="calc-section">
            <h4>Yearly Benefits</h4>
            <div className="calc-row-book">
              <span>Salary Savings</span>
              <span>₹{yearlySalarySavings.toLocaleString()}</span>
            </div>
            <div className="calc-row-book">
              <span>Missed Call Revenue</span>
              <span>₹{yearlyBenefit.toLocaleString()}</span>
            </div>
            <div className="calc-total">
              <span>Total</span>
              <span>₹{totalYearlyBenefit.toLocaleString()}</span>
            </div>
          </div>

          <div className="calc-percentage">
            <span className="percentage-num">{monthlyBenefitPercentage}%</span>
            <span className="percentage-label">Monthly Benefit vs Salary</span>
          </div>
        </div>

        <div className="calc-actions">
          <Button onClick={handleDownload} className="calc-download-btn">
            <Download size={16} className="mr-2" />
            Download PDF
          </Button>
          <Button onClick={handleWhatsAppShare} className="calc-whatsapp-btn">
            <Share2 size={16} className="mr-2" />
            Share on WhatsApp
          </Button>
        </div>
      </div>
    )
  };

  // Form page for data entry
  const formPage: PageContent = {
    image: relatedImg4, // Or any other relevant image
    title: "Add Restaurant Data",
    subtitle: "Input Details for Savings Calculation",
    content: (
      <div className="book-form">
        <div className="form-group">
          <Label htmlFor="restaurantName">Restaurant Name</Label>
          <Input
            id="restaurantName"
            name="restaurantName"
            value={formData.restaurantName}
            onChange={handleFormChange}
            placeholder="e.g., The Grand Bistro"
          />
        </div>
        <div className="form-group">
          <Label htmlFor="restaurantNumber">Restaurant Number</Label>
          <Input
            id="restaurantNumber"
            name="restaurantNumber"
            value={formData.restaurantNumber}
            onChange={handleFormChange}
            placeholder="e.g., 9876543210"
          />
        </div>
        <div className="form-group">
          <Label htmlFor="avgMissCallPerDay">Avg. Missed Calls / Day</Label>
          <Input
            id="avgMissCallPerDay"
            name="avgMissCallPerDay"
            type="number"
            value={formData.avgMissCallPerDay}
            onChange={handleFormChange}
            placeholder="e.g., 20"
          />
        </div>
        <div className="form-group">
          <Label htmlFor="avgOrderValue">Avg. Order Value (₹)</Label>
          <Input
            id="avgOrderValue"
            name="avgOrderValue"
            type="number"
            value={formData.avgOrderValue}
            onChange={handleFormChange}
            placeholder="e.g., 500"
          />
        </div>
        <div className="form-group">
          <Label htmlFor="receptionStaffSalary">Reception Staff Salary (₹/month)</Label>
          <Input id="receptionStaffSalary" name="receptionStaffSalary" type="number" value={formData.receptionStaffSalary} onChange={handleFormChange} placeholder="e.g., 18000" />
        </div>
        <Button onClick={handleSave} className="save-btn">Save Data</Button>
      </div>
    )
  };

  const pages: PageContent[] = [calculatorPage, formPage, ...staticPages];

  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === pages.length - 1;

  const turnRight = useCallback(() => {
    if (isLastPage || isAnimating) return;
    setIsAnimating(true);

    setCurrentIndex((prev) => {
      let newIndex = prev;
      
      if (newIndex >= 1) {
        newIndex = prev - 1;
      } else {
        newIndex = pages.length - 1;
        setFlipped(new Array(pages.length).fill(false));
        setZIndices(new Array(pages.length).fill(0));
        zRef.current = 1;
      }

      setFlipped((prevFlipped) => {
        const newFlipped = [...prevFlipped];
        newFlipped[newIndex] = true;
        return newFlipped;
      });

      zRef.current++;
      setZIndices((prevZ) => {
        const newZ = [...prevZ];
        newZ[newIndex] = zRef.current;
        return newZ;
      });

      return newIndex;
    });
    
    const nextPage = Math.min(currentPage + 1, pages.length - 1);
    setCurrentPage(nextPage);
    
    // Delay image change until flip animation is halfway done
    setTimeout(() => {
      setDisplayedImage(nextPage);
      setIsAnimating(false);
    }, 400);
  }, [isLastPage, isAnimating, pages.length, currentPage]);

  const turnLeft = useCallback(() => {
    if (isFirstPage || isAnimating) return;
    setIsAnimating(true);

    const prevPage = Math.max(currentPage - 1, 0);

    // Change image immediately when going back
    setDisplayedImage(prevPage);
    
    setCurrentIndex((prev) => {
      let newIndex = prev;
      
      if (newIndex < pages.length) {
        newIndex = prev + 1;
      } else {
        newIndex = 1;
        const newFlipped = new Array(pages.length).fill(true);
        newFlipped[0] = false;
        setFlipped(newFlipped);
        
        const newZ = pages.map((_, i) => pages.length + 1 - i);
        setZIndices(newZ);
        return newIndex;
      }

      setFlipped((prevFlipped) => {
        const newFlipped = [...prevFlipped];
        newFlipped[newIndex - 1] = false;
        return newFlipped;
      });

      setTimeout(() => {
        setZIndices((prevZ) => {
          const newZ = [...prevZ];
          newZ[newIndex - 1] = 0;
          return newZ;
        });
      }, 350);

      return newIndex;
    });
    
    setCurrentPage(prevPage);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 400);
  }, [isFirstPage, isAnimating, pages.length, currentPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        turnRight();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        turnLeft();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [turnLeft, turnRight]);



  return (
    <div className="book-section">
      <p className="credit-text">
        Created by <a href="https://infoaios.ai" target="_blank" rel="noopener noreferrer">infoaios.ai</a>
      </p>
      
      <div className="book-container">
        {/* Left side - Static related image display */}
        <div className="page-left">
          <figure 
            className="left-image"
            style={{ backgroundImage: `url(${pages[displayedImage].image})` }}
          />
        </div>
        
        {/* Right side - Flipping pages with content */}
        {pages.map((page, index) => (
          <div
            key={index}
            className={`page-right ${flipped[index] ? 'flip' : ''}`}
            style={{ zIndex: zIndices[index] || 'auto' }}
          >
            {/* Back of page - shows IMAGE of previous page */}
            <figure 
              className="page-back"
              style={{
                backgroundImage: index > 0 ? `url(${pages[index - 1].image})` : undefined,
                backgroundColor: index === 0 ? '#0f1629' : undefined,
              }}
            />
            {/* Front of page - shows TEXT content */}
            <figure className="page-front">
              <div className="page-content">
                <h3 className="page-subtitle">{page.subtitle}</h3>
                <h1 className="page-title">{page.title}</h1>
                <div className="page-body">{page.content}</div>
              </div>
            </figure>
          </div>
        ))}
      </div>

      <div className="book-nav">
        <button 
          onClick={turnLeft} 
          className={`nav-btn ${isFirstPage ? 'disabled' : ''}`}
          disabled={isFirstPage}
        >
          ← Prev
        </button>
        <span className="page-indicator">{currentPage + 1} / {pages.length}</span>
        <button 
          onClick={turnRight} 
          className={`nav-btn ${isLastPage ? 'disabled' : ''}`}
          disabled={isLastPage}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default BookFlipSlider;
