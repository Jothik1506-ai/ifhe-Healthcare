import React, { useState, useEffect } from "react";
import { privateAxios } from "../api/axios";
import '../Styles/DownloadQRCodes.css';

function DownloadQRCodes() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    // Default configuration: 3 columns x 4 rows (12 per page) in Portrait
    const [config, setConfig] = useState({
        orientation: 'portrait',
        columns: 3,
        rows: 4,
        pageMargin: 10 // mm
    });

    useEffect(() => {
        privateAxios
            .get("/api/admin/get_patients")
            .then((response) => {
                setPatients(response.data);
                setLoading(false);
            })
            .catch((error) => {
                console.log(error);
                setLoading(false);
            });
    }, []);

    const handlePrint = () => {
        window.print();
    };

    const handleConfigChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: name === 'orientation' ? value : parseInt(value)
        }));
    };

    // Calculate dimensions for print
    // A4 Portrait: 210mm x 297mm
    // A4 Landscape: 297mm x 210mm
    const getPrintStyles = () => {
        const isPortrait = config.orientation === 'portrait';
        const pageWidth = isPortrait ? 210 : 297;
        const pageHeight = isPortrait ? 297 : 210;

        const usableWidth = pageWidth - (config.pageMargin * 2);
        const usableHeight = pageHeight - (config.pageMargin * 2);

        const cardWidth = usableWidth / config.columns;
        const cardHeight = usableHeight / config.rows;

        // We subtract a tiny amount (0.5mm) to avoid rounding errors causing overflow
        return `
            @media print {
                @page {
                    size: ${config.orientation} A4;
                    margin: ${config.pageMargin}mm;
                }
                
                .qr-grid {
                    display: grid !important;
                    grid-template-columns: repeat(${config.columns}, 1fr) !important;
                    grid-auto-rows: ${cardHeight - 0.5}mm !important;
                    width: 100% !important;
                    gap: 0 !important; /* Gap handled by padding inside card if needed, or exact sizing */
                }

                .qr-card {
                    width: ${cardWidth - 0.5}mm !important;
                    height: ${cardHeight - 0.5}mm !important;
                    border: 1px solid #ccc; /* Light border for cutting guides */
                    page-break-inside: avoid !important;
                    box-sizing: border-box !important;
                    display: flex !important;
                    flex-direction: column !important;
                    justify-content: center !important;
                    align-items: center !important;
                    padding: 5mm !important;
                    margin: 0 !important;
                }

                .qr-image-container img {
                    width: ${Math.min(cardWidth, cardHeight) * 0.5}mm !important;
                    height: ${Math.min(cardWidth, cardHeight) * 0.5}mm !important;
                }
            }
        `;
    };

    if (loading) {
        return <div className="loading-container">Loading patients...</div>;
    }

    return (
        <div className="download-qr-container">
            <style>{getPrintStyles()}</style>

            <div className="no-print header-actions">
                <h1>Download Patient QR Codes</h1>

                <div className="controls-panel">
                    <div className="control-group">
                        <label>Orientation:</label>
                        <select name="orientation" value={config.orientation} onChange={handleConfigChange}>
                            <option value="portrait">Portrait</option>
                            <option value="landscape">Landscape</option>
                        </select>
                    </div>

                    <div className="control-group">
                        <label>Columns:</label>
                        <select name="columns" value={config.columns} onChange={handleConfigChange}>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                        </select>
                    </div>

                    <div className="control-group">
                        <label>Rows per Page:</label>
                        <select name="rows" value={config.rows} onChange={handleConfigChange}>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                            <option value="6">6</option>
                        </select>
                    </div>

                    <button onClick={handlePrint} className="print-all-btn">
                        Print / Save PDF
                    </button>
                </div>
            </div>

            <div className="qr-grid-preview-wrapper">
                <div className="qr-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${config.columns}, 1fr)`,
                    gap: '10px'
                }}>
                    {patients.map((patient) => (
                        <div key={patient._id} className="qr-card">
                            <div className="qr-image-container">
                                {patient.qr ? (
                                    <img src={patient.qr} alt={`QR for ${patient.book_no}`} />
                                ) : (
                                    <div className="no-qr">No QR</div>
                                )}
                            </div>
                            <div className="qr-details">
                                <h3 className="qr-book-no">{patient.book_no}</h3>
                                <p className="qr-name">{patient.patient_name}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default DownloadQRCodes;
