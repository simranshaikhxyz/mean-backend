const express = require('express');
const router = express.Router();
const Weather = require('../models/Weather');
const MandiRate = require('../models/MandiRate');
const Disease = require('../models/Disease');
const Crop = require('../models/Crop');

// ========== WEATHER API ==========
router.get('/weather', async (req, res) => {
    try {
        const { city = 'Pune' } = req.query;
        
        // Try to get from database
        let weatherData = await Weather.findOne({ city: city }).sort({ timestamp: -1 });
        
        if (!weatherData) {
            // If no data in DB, create mock data
            const mockWeather = {
                city: city,
                temperature: Math.floor(Math.random() * 10) + 25,
                condition: "Partly Cloudy",
                humidity: Math.floor(Math.random() * 30) + 50,
                wind_speed: (Math.random() * 5 + 2).toFixed(1),
                feels_like: Math.floor(Math.random() * 10) + 25,
                pressure: 1013,
                sunrise: "6:30 AM",
                sunset: "6:45 PM",
                icon: "https://openweathermap.org/img/wn/02d@2x.png",
                description: "Partly cloudy with chance of rain",
                timestamp: new Date()
            };
            
            weatherData = new Weather(mockWeather);
            await weatherData.save();
        }
        
        res.json({
            success: true,
            ...weatherData.toObject()
        });
        
    } catch (error) {
        console.error('Weather Error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// ========== MANDI RATES API ==========
router.get('/mandi-rates', async (req, res) => {
    try {
        const rates = await MandiRate.find().sort({ date: -1 }).limit(20);
        
        if (rates.length === 0) {
            return res.json({
                success: true,
                data: [],
                message: "No mandi rates available"
            });
        }
        
        res.json({
            success: true,
            data: rates,
            count: rates.length,
            source: "Local Database",
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('Mandi Rates Error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// ========== YIELD CALCULATOR ==========
router.post('/calculate-yield', async (req, res) => {
    try {
        const { area, crop, unit } = req.body;
        
        if (!area || !crop) {
            return res.status(400).json({
                success: false,
                error: 'Area and crop are required'
            });
        }
        
        // Crop yield data (kg per acre)
        const cropYields = {
            'wheat': { per_acre: 1800, unit: 'kg' },
            'rice': { per_acre: 2500, unit: 'kg' },
            'cotton': { per_acre: 900, unit: 'kg' },
            'sugarcane': { per_acre: 35000, unit: 'kg' },
            'soybean': { per_acre: 1200, unit: 'kg' },
            'maize': { per_acre: 3000, unit: 'kg' }
        };
        
        const cropData = cropYields[crop] || cropYields['wheat'];
        const areaInAcres = unit === 'hectare' ? area * 2.47105 : parseFloat(area);
        const totalYield = (areaInAcres * cropData.per_acre).toFixed(2);
        
        res.json({
            success: true,
            area: area,
            unit: unit,
            area_in_acres: areaInAcres.toFixed(2),
            crop: crop,
            yield_per_acre: cropData.per_acre,
            yield_unit: cropData.unit,
            total_yield: totalYield,
            calculation_date: new Date()
        });
        
    } catch (error) {
        console.error('Yield Calculator Error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// ========== DISEASES API ==========
router.get('/diseases', async (req, res) => {
    try {
        const diseases = await Disease.find().limit(10);
        
        res.json({
            success: true,
            data: diseases,
            count: diseases.length
        });
        
    } catch (error) {
        console.error('Diseases Error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// ========== CROPS API ==========
router.get('/crops', async (req, res) => {
    try {
        const crops = await Crop.find();
        
        res.json({
            success: true,
            data: crops,
            count: crops.length
        });
        
    } catch (error) {
        console.error('Crops Error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

router.get('/crops/:name', async (req, res) => {
    try {
        const crop = await Crop.findOne({ name: req.params.name });
        
        if (!crop) {
            return res.status(404).json({
                success: false,
                error: 'Crop not found'
            });
        }
        
        res.json({
            success: true,
            data: crop
        });
        
    } catch (error) {
        console.error('Crop Detail Error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// ========== TRANSLATION (Simple Local) ==========
router.post('/translate', (req, res) => {
    try {
        const { text, targetLang } = req.body;
        
        // Simple translation mapping
        const translations = {
            'en': {
                'Weather': 'Weather',
                'Mandi Rates': 'Mandi Rates',
                'Calculator': 'Calculator',
                'Diseases': 'Diseases'
            },
            'hi': {
                'Weather': 'मौसम',
                'Mandi Rates': 'मंडी भाव',
                'Calculator': 'कैलकुलेटर',
                'Diseases': 'रोग'
            },
            'mr': {
                'Weather': 'हवामान',
                'Mandi Rates': 'मंडी दर',
                'Calculator': 'कॅल्क्युलेटर',
                'Diseases': 'रोग'
            }
        };
        
        const translation = translations[targetLang]?.[text] || text;
        
        res.json({
            success: true,
            original: text,
            translated: translation,
            targetLang: targetLang
        });
        
    } catch (error) {
        console.error('Translation Error:', error);
        res.status(500).json({
            success: false,
            error: 'Translation failed'
        });
    }
});

module.exports = router;