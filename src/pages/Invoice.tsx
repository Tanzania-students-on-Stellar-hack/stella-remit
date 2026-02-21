import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Download, Send } from "lucide-react";
import { toast } from "sonner";

const Invoice = () => {
  const { profile } = useAuth();
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: `INV-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    recipientName: '',
    recipientAddress: '',
    description: '',
    amount: '',
    currency: 'XLM',
  });

  const handleInputChange = (field: string, value: string) => {
    setInvoiceData(prev => ({ ...prev, [field]: value }));
  };

  const generateInvoicePDF = () => {
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .invoice-details { margin: 20px 0; }
          .row { display: flex; justify-content: space-between; margin: 10px 0; }
          .label { font-weight: bold; }
          .total { font-size: 24px; margin-top: 30px; text-align: right; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INVOICE</h1>
          <p>${invoiceData.invoiceNumber}</p>
        </div>
        <div class="invoice-details">
          <div class="row">
            <div><span class="label">From:</span> ${profile?.email || 'N/A'}</div>
            <div><span class="label">Date:</span> ${invoiceData.date}</div>
          </div>
          <div class="row">
            <div><span class="label">To:</span> ${invoiceData.recipientName}</div>
            <div><span class="label">Due Date:</span> ${invoiceData.dueDate}</div>
          </div>
          <div class="row">
            <div><span class="label">Address:</span> ${invoiceData.recipientAddress}</div>
          </div>
          <hr style="margin: 20px 0;">
          <div class="row">
            <div><span class="label">Description:</span></div>
          </div>
          <p>${invoiceData.description}</p>
          <div class="total">
            <span class="label">Total: ${invoiceData.amount} ${invoiceData.currency}</span>
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoiceData.invoiceNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Invoice downloaded!");
  };

  const sendInvoice = () => {
    toast.info("Invoice sending feature coming soon!");
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold font-serif mb-6">Create Invoice</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" />
                Invoice Details
              </CardTitle>
              <CardDescription>Fill in the invoice information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={invoiceData.invoiceNumber}
                  onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={invoiceData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={invoiceData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="recipientName">Recipient Name</Label>
                <Input
                  id="recipientName"
                  placeholder="John Doe"
                  value={invoiceData.recipientName}
                  onChange={(e) => handleInputChange('recipientName', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="recipientAddress">Recipient Stellar Address</Label>
                <Input
                  id="recipientAddress"
                  placeholder="GXXX..."
                  value={invoiceData.recipientAddress}
                  onChange={(e) => handleInputChange('recipientAddress', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Services rendered..."
                  value={invoiceData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="100.00"
                    value={invoiceData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={invoiceData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={generateInvoicePDF} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button onClick={sendInvoice} variant="outline" className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-6 bg-white text-black min-h-[500px]">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold">INVOICE</h2>
                  <p className="text-sm text-gray-600">{invoiceData.invoiceNumber}</p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">From:</p>
                      <p>{profile?.email || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">Date:</p>
                      <p>{invoiceData.date}</p>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">To:</p>
                      <p>{invoiceData.recipientName || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">Due Date:</p>
                      <p>{invoiceData.dueDate || 'N/A'}</p>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold">Stellar Address:</p>
                    <p className="text-xs break-all">{invoiceData.recipientAddress || 'N/A'}</p>
                  </div>

                  <hr className="my-4" />

                  <div>
                    <p className="font-semibold mb-2">Description:</p>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {invoiceData.description || 'No description provided'}
                    </p>
                  </div>

                  <div className="pt-6 text-right">
                    <p className="text-2xl font-bold">
                      {invoiceData.amount || '0.00'} {invoiceData.currency}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Invoice;
