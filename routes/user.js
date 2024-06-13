const express = require('express');
const axios = require('axios');
const qrcode = require('qrcode');
const router = express.Router();


const VAULT_ADDR = process.env.VAULT_ADDR || "http://localhost:8200";
const VAULT_TOKEN = process.env.VAULT_TOKEN || "";
const VAULT_NAMESPACE = process.env.VAULT_NAMESPACE || "";

var headers = {}

if(VAULT_NAMESPACE != ""){
    headers = {
        headers: {
            'X-Vault-Token': VAULT_TOKEN,
            'X-Vault-Namespace': VAULT_NAMESPACE,
        }
    }
}else {
    headers = {
        headers: {
            'X-Vault-Token': VAULT_TOKEN
        }
    }
}

// Register a user and generate TOTP
router.post('/register', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).send('Email is required');
    }

    try {
        // Check if TOTP key already exists
        const existingKey = await axios.get(`${VAULT_ADDR}/v1/totp/keys/${email}`, headers);

        if (existingKey.data && existingKey.data.data) {
            // TOTP key already exists
            return res.redirect(`/register?error=${encodeURIComponent('TOTP key already exists for this email')}`);
        }
    } catch (error) {
        if (error.response && error.response.status !== 404) {
            console.error(error);
            return res.status(500).send('Error checking TOTP key');
        }
    }

    try {
        // Create TOTP key
        const response = await axios.post(`${VAULT_ADDR}/v1/totp/keys/${email}`, {
            generate: true,
            issuer: 'MyApp',
            account_name: email
        }, 
            headers
        );

        const key = response.data.data;
        const otpauth = key.url;

        // Generate QR code
        qrcode.toDataURL(otpauth, (err, url) => {
            if (err) {
                return res.status(500).send('Error generating QR code');
            }
            res.redirect(`/register?qr_code=${encodeURIComponent(url)}`);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating TOTP key');
    }
});

// Validate TOTP code
router.post('/validate', async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
        return res.status(400).send('Email and code are required');
    }

    try {
        const response = await axios.post(`${VAULT_ADDR}/v1/totp/code/${email}`, {
            code
        }, 
            headers
        );

        const result = response.data.data.valid ? 'Code is valid' : 'Code is invalid';
        res.redirect(`/validate?result=${encodeURIComponent(result)}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error validating TOTP code');
    }
});

module.exports = router;
