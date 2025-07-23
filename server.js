require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 5000;

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json());

// Route d'inscription (sans hashage)
app.post('/register', async (req, res) => {
  try {
    const { fullName, phoneNumber, password } = req.body;

    if (!fullName || !phoneNumber || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    // Vérifier si l'utilisateur existe déjà
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Ce numéro est déjà utilisé' });
    }

    // Stockage du mot de passe en CLAIR (non sécurisé)
    const { data, error } = await supabase
      .from('users')
      .insert([
        { 
          full_name: fullName, 
          phone_number: phoneNumber, 
          password: password // ⚠️ Mot de passe non hashé
        }
      ])
      .select();

    if (error) throw error;

    res.status(201).json({
      message: 'Utilisateur enregistré avec succès',
      user: data[0]
    });

  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route de connexion (vérification en CLAIR)
// Route de connexion
app.post('/login', async (req, res) => {
    const { phoneNumber, password } = req.body;
  
    if (!phoneNumber || !password) {
      return res.status(400).json({ error: 'Numéro et mot de passe requis' });
    }
  
    try {
      // Recherche de l'utilisateur
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();
  
      if (error || !user) {
        return res.status(401).json({ error: 'Numéro incorrect' });
      }
  
      // Vérification mot de passe en clair
      if (password !== user.password) {
        return res.status(401).json({ error: 'Mot de passe incorrect' });
      }
  
      // Réponse réussie
      res.json({ 
        success: true,
        user: { id: user.id, full_name: user.full_name } 
      });
  
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });
  

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur en écoute sur le port ${port}`);
});