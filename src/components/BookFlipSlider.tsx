import { useRef, useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, Share2, Calculator, ChevronLeft, ChevronRight, Sparkles, TrendingUp, Users, Phone, DollarSign, FileText, Zap, Award, CheckCircle, ArrowRight, Star } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { autoTable, UserOptions } from 'jspdf-autotable';
import 'jspdf-autotable';
import './BookFlipSlider.css';

// Import related images for left side (content-related)
import relatedImg1 from '@/assets/images/related_12.jpg';
import relatedImg2 from '@/assets/images/related_1.jpg';
import relatedImg3 from '@/assets/images/related_2.jpg';
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
  { name: 'Basic', price: 900, features: ['24/7 Call Answering', 'Order Taking', 'Basic Analytics'] },
  { name: 'Standard', price: 1200, features: ['All Basic Features', 'Multi-language Support', 'Advanced Analytics', 'Priority Support'] },
  { name: 'Premium', price: 1800, features: ['All Standard Features', 'Custom Voice Training', 'CRM Integration', 'Dedicated Account Manager'] },
];

interface PageContent {
  image: string;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  gradient?: string;
}

const BookFlipSlider = () => {
  const totalPages = 14;
  const [currentPage, setCurrentPage] = useState(0);
  const [displayedImage, setDisplayedImage] = useState(0);
  // Initialize z-indices so first page is on top (highest z-index)
  const [zIndices, setZIndices] = useState<number[]>(() => 
    Array.from({ length: totalPages }, (_, i) => totalPages - i)
  );
  const [flipped, setFlipped] = useState<boolean[]>(new Array(totalPages).fill(false));
  const [isAnimating, setIsAnimating] = useState(false);
  const zRef = useRef(totalPages);
  const calculatorRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    restaurantName: '',
    restaurantNumber: '',
    avgMissCallPerDay: '',
    avgOrderValue: '',
    receptionStaffSalary: '',
  });
  const [selectedPlan, setSelectedPlan] = useState('Standard');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchedData, setSearchedData] = useState<FormData | null>(null);
  const [suggestions, setSuggestions] = useState<FormData[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
    
    setIsSaving(true);
    
    // Simulate saving process
    setTimeout(() => {
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
      setIsSaving(false);
      setSaveSuccess(true);
      
      // Reset success message after 2 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
      
      // Animate to the calculator page after a short delay
      setTimeout(() => {
        turnRight();
      }, 500);
    }, 1000);
  };

  // Calculator calculations - use searched data if available, otherwise use form data
  const currentData = searchedData || formData;
  const planPrice = plans.find(p => p.name === selectedPlan)?.price || 1200;
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
We provide an AI-powered Voice Call Assistant that helps restaurants handle calls 24/7, never missing an order again. With our Savings Calculator, discover how much you can save by automating your call handling, reducing staffing costs, and improving order accuracy. Let's help your restaurant grow with less effort!

Please find the detailed savings report for *${restaurantName}* attached.`.trim();

    // 4. Open WhatsApp with the pre-filled message.
    const whatsappUrl = `https://wa.me/${countryCode}${restaurantNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const staticPages: PageContent[] = [
    {
      image: relatedImg1,
      title: "InfoAIOS — AI Voice Call Assistant",
      subtitle: "India's No.1 AI Voice Receptionist for Cafes & Restaurants",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      content: (
        <>
          <div className="hero-section">
            <div className="hero-icon">
              <Sparkles size={32} />
            </div>
            <div className="feature-list">
              <div className="feature-item">
                <CheckCircle className="feature-icon" size={16} />
                <span>Answer Every Call 24×7</span>
              </div>
              <div className="feature-item">
                <CheckCircle className="feature-icon" size={16} />
                <span>Capture Every Order</span>
              </div>
              <div className="feature-item">
                <CheckCircle className="feature-icon" size={16} />
                <span>Zero Staff Needed</span>
              </div>
            </div>
            <div className="contact-info">
              <p><strong>Contact:</strong> +91 83204 85536</p>
              <p><strong>Website:</strong> www.infoaios.ai</p>
              <p><strong>Email:</strong> infoaios.ai@gmail.com</p>
            </div>
          </div>
        </>
      )
    },
    {
      image: relatedImg3,
      title: "Executive Summary",
      subtitle: "24×7 AI Voice Receptionist for Indian Cafes & Restaurants",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      content: (
        <>
          <div className="summary-section">
            <p className="summary-text">InfoAIOS ensures every incoming call is answered, orders and reservations are captured accurately, and customers receive instant confirmations via WhatsApp.</p>
            <div className="key-outcomes">
              <h4 className="outcomes-title">Key Outcomes:</h4>
              <div className="outcomes-list">
                <div className="outcome-item">
                  <TrendingUp className="outcome-icon" size={16} />
                  <span>Missed Calls → Missed Orders → Lost Revenue</span>
                </div>
                <div className="outcome-item">
                  <Users className="outcome-icon" size={16} />
                  <span>Reduce Staff Overload</span>
                </div>
                <div className="outcome-item">
                  <DollarSign className="outcome-icon" size={16} />
                  <span>Reduce Staffing Cost</span>
                </div>
                <div className="outcome-item">
                  <Award className="outcome-icon" size={16} />
                  <span>Increase Order Accuracy & Repeat Business</span>
                </div>
                <div className="outcome-item">
                  <FileText className="outcome-icon" size={16} />
                  <span>Provide Actionable Analytics to Owners</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )
    },
    {
      image: relatedImg6,
      title: "Problems Faced by F&B Businesses",
      subtitle: "Challenges We Solve",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      content: (
        <div className="problems-section">
          <div className="problems-list">
            <div className="problem-item">
              <div className="problem-icon">
                <Phone size={20} />
              </div>
              <div className="problem-content">
                <h4>Missed calls during peak hours</h4>
                <p>→ Lost revenue</p>
              </div>
            </div>
            <div className="problem-item">
              <div className="problem-icon">
                <DollarSign size={20} />
              </div>
              <div className="problem-content">
                <h4>High cost & turnover for front-desk staff</h4>
              </div>
            </div>
            <div className="problem-item">
              <div className="problem-icon">
                <FileText size={20} />
              </div>
              <div className="problem-content">
                <h4>Human errors in order taking</h4>
              </div>
            </div>
            <div className="problem-item">
              <div className="problem-icon">
                <Zap size={20} />
              </div>
              <div className="problem-content">
                <h4>Time wasted answering repeated FAQ calls</h4>
              </div>
            </div>
            <div className="problem-item">
              <div className="problem-icon">
                <FileText size={20} />
              </div>
              <div className="problem-content">
                <h4>Lack of call records and insights for decisions</h4>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      image: relatedImg4,
      title: "Solution Overview",
      subtitle: "InfoAIOS AI Voice Receptionist Features",
      gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      content: (
        <div className="solution-section">
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-card-icon">
                <Phone size={24} />
              </div>
              <h4>24×7 Auto-Answering</h4>
              <p>Take Orders & Share Menu</p>
            </div>
            <div className="feature-card">
              <div className="feature-card-icon">
                <Zap size={24} />
              </div>
              <h4>Track Delivery</h4>
              <p>Solve Customer Queries</p>
            </div>
            <div className="feature-card">
              <div className="feature-card-icon">
                <FileText size={24} />
              </div>
              <h4>Natural-Language Order Taking</h4>
              <p>Real-time WhatsApp Confirmation</p>
            </div>
            <div className="feature-card">
              <div className="feature-card-icon">
                <Users size={24} />
              </div>
              <h4>Multi-Language Support</h4>
              <p>Gujarati / Hindi / English</p>
            </div>
          </div>
        </div>
      )
    },
    {
      image: relatedImg5,
      title: "Core Call Features",
      subtitle: "Detailed Features",
      gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      content: (
        <div className="core-features-section">
          <div className="core-features-list">
            <div className="core-feature-item">
              <div className="core-feature-number">1</div>
              <div className="core-feature-content">
                <h4>Instant Pickup</h4>
                <p>Brand-scripted greeting with customizable voice</p>
              </div>
            </div>
            <div className="core-feature-item">
              <div className="core-feature-number">2</div>
              <div className="core-feature-content">
                <h4>Intent Detection</h4>
                <p>Identifies order, reservation, query, or complaint</p>
              </div>
            </div>
            <div className="core-feature-item">
              <div className="core-feature-number">3</div>
              <div className="core-feature-content">
                <h4>Confirm & Route</h4>
                <p>Confirms order details, reads price & ETA, forwards to kitchen/POS</p>
              </div>
            </div>
            <div className="core-feature-item">
              <div className="core-feature-number">4</div>
              <div className="core-feature-content">
                <h4>WhatsApp Slip</h4>
                <p>Sends itemised order slip and payment link (optional)</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      image: relatedImg6,
      title: "Automation & Integrations",
      subtitle: "Seamless Connectivity",
      gradient: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
      content: (
        <div className="automation-section">
          <div className="automation-list">
            <div className="automation-item">
              <div className="automation-icon">
                <Zap size={20} />
              </div>
              <div className="automation-content">
                <h4>POS / CRM API Integration</h4>
                <p>Push orders and customer data</p>
              </div>
            </div>
            <div className="automation-item">
              <div className="automation-icon">
                <Phone size={20} />
              </div>
              <div className="automation-content">
                <h4>Delivery App Sync</h4>
                <p>Zomato/Swiggy for own delivery management</p>
              </div>
            </div>
            <div className="automation-item">
              <div className="automation-icon">
                <Users size={20} />
              </div>
              <div className="automation-content">
                <h4>Staff Notifications</h4>
                <p>WhatsApp or SMS alerts for big orders or issues</p>
              </div>
            </div>
            <div className="automation-item">
              <div className="automation-icon">
                <FileText size={20} />
              </div>
              <div className="automation-content">
                <h4>Daily Reports</h4>
                <p>Peak-time analytics, missed-call elimination stats</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      image: relatedImg7,
      title: "Sample Call Flow",
      subtitle: "Step-by-Step Process",
      gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
      content: (
        <div className="call-flow-section">
          <div className="call-flow-container">
            <div className="call-flow-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Caller dials restaurant number</h4>
              </div>
              <div className="step-arrow">
                <ArrowRight size={16} />
              </div>
            </div>
            <div className="call-flow-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Greeting</h4>
                <p>"Welcome to [Brand]. How can I help you?"</p>
              </div>
              <div className="step-arrow">
                <ArrowRight size={16} />
              </div>
            </div>
            <div className="call-flow-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Intent Detection</h4>
                <p>"Order karna hai" → Pickup or Delivery?</p>
              </div>
              <div className="step-arrow">
                <ArrowRight size={16} />
              </div>
            </div>
            <div className="call-flow-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Capture Details</h4>
                <p>Name, phone, items, quantity, address</p>
              </div>
              <div className="step-arrow">
                <ArrowRight size={16} />
              </div>
            </div>
            <div className="call-flow-step">
              <div className="step-number">5</div>
              <div className="step-content">
                <h4>Confirm & Send</h4>
                <p>Confirm Pricing & ETA, Send WhatsApp Slip</p>
              </div>
              <div className="step-arrow">
                <ArrowRight size={16} />
              </div>
            </div>
            <div className="call-flow-step">
              <div className="step-number">6</div>
              <div className="step-content">
                <h4>Push to System</h4>
                <p>Push to POS/Kitchen with unique order ID</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      image: relatedImg8,
      title: "Multilingual Voice Scripts",
      subtitle: "Sample Scripts",
      gradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
      content: (
        <div className="scripts-section">
          <div className="script-card">
            <div className="script-header">
              <h4>English (Formal)</h4>
            </div>
            <div className="script-content">
              <p>"Hello! You have reached [Restaurant Name]. Would you like to place an order, make a reservation, or ask about the menu?"</p>
            </div>
          </div>
          <div className="script-card">
            <div className="script-header">
              <h4>Hindi (Friendly)</h4>
            </div>
            <div className="script-content">
              <p>"Namaste! Aap [Restaurant Name] mein hain. Order, reservation ya menu dekhna?"</p>
            </div>
          </div>
          <div className="script-card">
            <div className="script-header">
              <h4>Gujarati (Casual)</h4>
            </div>
            <div className="script-content">
              <p>"Kem cho! Aap [Restaurant Name] ma aavya cho. Order karva chho ke reservation?"</p>
            </div>
          </div>
        </div>
      )
    },
    {
      image: relatedImg9,
      title: "Dashboard & Reports",
      subtitle: "What You Get",
      gradient: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
      content: (
        <div className="dashboard-section">
          <div className="dashboard-features">
            <div className="dashboard-feature">
              <div className="dashboard-icon">
                <FileText size={20} />
              </div>
              <h4>Real-time call log</h4>
              <p>with transcription & recording</p>
            </div>
            <div className="dashboard-feature">
              <div className="dashboard-icon">
                <TrendingUp size={20} />
              </div>
              <h4>Order reconciliation</h4>
              <p>AI vs kitchen/POS report</p>
            </div>
            <div className="dashboard-feature">
              <div className="dashboard-icon">
                <Zap size={20} />
              </div>
              <h4>Peak hour heatmap</h4>
              <p>and weekly trends</p>
            </div>
            <div className="dashboard-feature">
              <div className="dashboard-icon">
                <Award size={20} />
              </div>
              <h4>Missed-call reduction rate</h4>
              <p>and SLA stats</p>
            </div>
            <div className="dashboard-feature">
              <div className="dashboard-icon">
                <Users size={20} />
              </div>
              <h4>Customer database</h4>
              <p>with repeat-caller tag</p>
            </div>
          </div>
        </div>
      )
    },
    {
      image: relatedImg10,
      title: "ROI Example",
      subtitle: "1-Page Calculation",
      gradient: "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
      content: (
        <div className="roi-section">
          <div className="roi-comparison">
            <div className="roi-card lost">
              <h4>Monthly Lost Revenue (Pre-AI)</h4>
              <div className="roi-calculation">
                <span>500 missed × 40% × ₹350</span>
                <span className="roi-result">= <strong>₹70,000</strong></span>
              </div>
            </div>
            <div className="roi-card recovered">
              <h4>Recovered with AI</h4>
              <div className="roi-calculation">
                <span>450 orders × 40% × ₹350</span>
                <span className="roi-result">= <strong>₹63,000</strong></span>
              </div>
            </div>
          </div>
          <div className="roi-savings">
            <h4>Staff Savings</h4>
            <p>₹15,000–25,000/month</p>
            <div className="roi-highlight">
              <p>Positive ROI in 1–2 months</p>
            </div>
          </div>
        </div>
      )
    },
    {
      image: relatedImg11,
      title: "FAQs",
      subtitle: "Frequently Asked Questions",
      gradient: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
      content: (
        <div className="faq-section">
          <div className="faq-list">
            <div className="faq-item">
              <h4>Q: Will AI understand local accents?</h4>
              <p>A: Yes — tuned for Gujarati, Hindi, and Indian-English accents.</p>
            </div>
            <div className="faq-item">
              <h4>Q: Can I keep my old number?</h4>
              <p>A: Yes — we support number porting subject to telecom regulations.</p>
            </div>
            <div className="faq-item">
              <h4>Q: What if AI cannot handle a call?</h4>
              <p>A: It will escalate to human staff or schedule a callback.</p>
            </div>
            <div className="faq-item">
              <h4>Q: Is customer data safe?</h4>
              <p>A: Yes — encrypted in transit and rest, role-based access controls.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      image: relatedImg12,
      title: "Next Steps & Contact",
      subtitle: "Quick Checklist to Start Today",
      gradient: "linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)",
      content: (
        <>
          <div className="steps-section">
            <div className="steps-list">
              <div className="step-item">
                <div className="step-number">1</div>
                <p>Schedule a live demo (Call / Zoom)</p>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <p>Share menu (CSV/Excel) & business hours</p>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <p>Decide on number porting vs new virtual number</p>
              </div>
              <div className="step-item">
                <div className="step-number">4</div>
                <p>Choose package (Starter / Growth / Enterprise)</p>
              </div>
              <div className="step-item">
                <div className="step-number">5</div>
                <p>Sign agreement & schedule onboarding date</p>
              </div>
            </div>
          </div>
          <div className="contact-info">
            <h3>InfoAIOS</h3>
            <p>Sun Sky Park, Ring Road, Bopal, Ahmedabad</p>
            <p><strong>Contact:</strong> +91 83204 85536</p>
            <p><strong>Web:</strong> www.infoaios.ai</p>
            <p><strong>Email:</strong> infoaios.ai@gmail.com</p>
          </div>
        </>
      )
    },
  ];

  // Calculator page (page 14)
  const calculatorPage: PageContent = {
    image: relatedImg5,
    title: "Your Savings Calculator",
    subtitle: currentData.restaurantName || "Results",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
          <Select  value={selectedPlan} onValueChange={setSelectedPlan}>
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
          {plans.find(p => p.name === selectedPlan) && (
            <div className="plan-features">
              <h5>Plan Features:</h5>
              <ul>
                {plans.find(p => p.name === selectedPlan)?.features.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
            </div>
          )}
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
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
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
        <Button onClick={handleSave} className="save-btn" disabled={isSaving}>
          {isSaving ? (
            <>
              <div className="spinner"></div>
              Saving...
            </>
          ) : (
            <>
              <Calculator size={16} className="mr-2" />
              Calculate Savings
            </>
          )}
        </Button>
        {saveSuccess && (
          <div className="success-message">
            <CheckCircle size={16} className="mr-2" />
            Data saved successfully!
          </div>
        )}
      </div>
    )
  };

  const pages: PageContent[] = [...staticPages, formPage, calculatorPage];

  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === pages.length - 1;

  const turnRight = useCallback(() => {
    if (isLastPage || isAnimating) return;
    setIsAnimating(true);

    // Flip the current page to reveal the next one
    const pageToFlip = currentPage;
    
    setFlipped((prevFlipped) => {
      const newFlipped = [...prevFlipped];
      newFlipped[pageToFlip] = true;
      return newFlipped;
    });

    // Give flipped page higher z-index so it animates on top
    zRef.current++;
    setZIndices((prevZ) => {
      const newZ = [...prevZ];
      newZ[pageToFlip] = zRef.current + totalPages;
      return newZ;
    });
    
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    
    // Delay image change until flip animation is halfway done
    setTimeout(() => {
      setDisplayedImage(nextPage);
      setIsAnimating(false);
    }, 400);
  }, [isLastPage, isAnimating, currentPage, totalPages]);

  const turnLeft = useCallback(() => {
    if (isFirstPage || isAnimating) return;
    setIsAnimating(true);

    const prevPage = currentPage - 1;
    
    // Change image immediately when going back
    setDisplayedImage(prevPage);
    
    // Unflip the previous page to go back
    setFlipped((prevFlipped) => {
      const newFlipped = [...prevFlipped];
      newFlipped[prevPage] = false;
      return newFlipped;
    });

    // Reset z-index of unflipped page after animation
    setTimeout(() => {
      setZIndices((prevZ) => {
        const newZ = [...prevZ];
        newZ[prevPage] = totalPages - prevPage;
        return newZ;
      });
    }, 350);
    
    setCurrentPage(prevPage);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 400);
  }, [isFirstPage, isAnimating, currentPage, totalPages]);

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
      <div className="book-header">
        <div className="logo-container">
          <Sparkles size={24} className="logo-icon" />
          <span className="logo-text">InfoAIOS</span>
        </div>
        <p className="credit-text">
          Created by <a href="https://infoaios.ai" target="_blank" rel="noopener noreferrer">infoaios.ai</a>
        </p>
      </div>
      
      <div className="book-container">
        {/* Left side - Static related image display */}
        <div className="page-left">
          <figure 
            className="left-image"
            style={{ backgroundImage: `url(${pages[displayedImage].image})` }}
          />
          <div className="page-overlay" style={{ background: pages[displayedImage].gradient }}></div>
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
          <ChevronLeft size={18} />
          Prev
        </button>
        <div className="page-indicator">
          <span className="current-page">{currentPage + 1}</span>
          <span className="divider">/</span>
          <span className="total-pages">{pages.length}</span>
        </div>
        <button 
          onClick={turnRight} 
          className={`nav-btn ${isLastPage ? 'disabled' : ''}`}
          disabled={isLastPage}
        >
          Next
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default BookFlipSlider;