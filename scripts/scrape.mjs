import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use the service role key to bypass RLS, otherwise fallback to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// CONFIGURATION: Customize this for your scrape
// ==========================================
// List of tasks to scrape. Add URLs and the corresponding Subject UUIDs here.
const TASKS = [
  // Example for Matematik 2019:
  // { url: 'https://trial.spmpaper.me/?dir=2019%2FMatematik', subjectId: '8764b396-8441-407f-9933-e31c5f6ff7a4', year: 2019 },

  // Add your new subjects here!
  // Subject IDs from your database:
  // Matematik Tambahan: '5385f218-f767-43ef-92de-da63d50708ec'
  // Fizik: 'd34b2e6e-f962-44b9-bd96-062017bd2761'
  // Sejarah: 'f20c754c-48f3-4d13-a0ec-31a95f27154a'
  // Kimia: '4aa74c62-25a9-4b89-8a68-f335f627691d'
  // Bahasa Melayu: 'e098c425-1e34-4395-8b98-0946b9eb83d5'
  // English: '839aaa63-3def-4757-b468-d4158b3e86f9'
  // Pendidikan Agama Islam: '6cddab4b-c8f0-4c2b-9766-d1ba882bc1c9'
  // Elektrik Elektronik: '7747be36-7291-408d-b6eb-9ad2610e6780'
  // Mekanikal: 'b17f4ef9-301f-4a82-869f-365dda5a54f1'
  // Lukisan Kejuruteraan: 'e44e8d50-2ddc-41de-aef7-96e5f67beecf'
];

async function runScraper() {
  if (TASKS.length === 0) {
    console.log("No tasks defined in the TASKS array. Please add some targets first!");
    return;
  }

  for (const task of TASKS) {
    const { url: TARGET_URL, subjectId: SUBJECT_ID, year: YEAR } = task;
    console.log(`\n==========================================`);
    console.log(`Starting scrape of: ${TARGET_URL}`);

    try {
      // 1. Fetch the main subject HTML (which contains folders like Johor, Kedah, etc.)
      const response = await axios.get(TARGET_URL);
      const $ = cheerio.load(response.data);

      // Find all state folders
      const stateLinks = [];
      const dirQuery = decodeURIComponent(TARGET_URL.split('?dir=')[1] || '');

      $('a').each((i, element) => {
        let href = $(element).attr('href');
        if (href && href.includes('?dir=') && !href.includes('&order=')) {
          const decodedHref = decodeURIComponent(href);
          if (decodedHref.includes(dirQuery) && decodedHref.length > `?dir=${dirQuery}`.length) {
            const fullUrl = href.startsWith('http') ? href : `https://trial.spmpaper.me${href.startsWith('/') ? '' : '/'}${href}`;
            if (!stateLinks.includes(fullUrl)) stateLinks.push(fullUrl);
          }
        }
      });

      console.log(`Found ${stateLinks.length} state folders! Crawling them to find PDFs...`);

      const pdfLinks = [];

      // 2. Crawl each state folder to find actual .pdf files
      for (const stateUrl of stateLinks) {
        try {
          const stateRes = await axios.get(stateUrl);
          const state$ = cheerio.load(stateRes.data);

          let folderNegeri = 'Unknown';
          try {
            const urlObj = new URL(stateUrl);
            const dirParam = urlObj.searchParams.get('dir');
            if (dirParam) {
              const parts = dirParam.split('/');
              let rawNegeri = parts[parts.length - 1];
              if (rawNegeri) {
                if (rawNegeri.toUpperCase() === 'N9') folderNegeri = 'Negeri Sembilan';
                else if (rawNegeri.toUpperCase() === 'SBP') folderNegeri = 'SBP';
                else if (rawNegeri.toUpperCase() === 'MRSM') folderNegeri = 'MRSM';
                else folderNegeri = rawNegeri.charAt(0).toUpperCase() + rawNegeri.slice(1).toLowerCase();
              }
            }
          } catch (_err) { }

          state$('a').each((i, element) => {
            let href = state$(element).attr('href');
            const text = state$(element).text().trim();
            if (href && href.toLowerCase().includes('.pdf')) {
              // Ensure absolute URL
              if (!href.startsWith('http')) {
                href = `https://trial.spmpaper.me${href.startsWith('/') ? '' : '/'}${href}`;
              }
              pdfLinks.push({ url: href, name: text || `Paper_${i}`, negeri: folderNegeri });
            }
          });
        } catch (e) {
          console.error(`Failed to crawl folder ${stateUrl}:`, e.message);
        }
      }

      console.log(`Found ${pdfLinks.length} PDF links in total!`);

      // 3. Download and Upload each PDF
      for (const link of pdfLinks) {
        console.log(`\nProcessing: ${link.name}`);

        try {
          // A. Download the PDF file into memory
          console.log(`Downloading from ${link.url}...`);
          const pdfResponse = await axios.get(link.url, { responseType: 'arraybuffer' });
          const pdfBuffer = Buffer.from(pdfResponse.data);

          // Basic parsing logic (you can improve this based on filenames!)
          let negeri = link.negeri || 'Unknown';

          let lowerName = link.name.toLowerCase();
          let paperType = 'Kertas 1';

          let isKertas1 = lowerName.includes('k1') || lowerName.includes('kertas 1') || lowerName.includes('p1') || lowerName.includes('paper 1');
          let isKertas2 = lowerName.includes('k2') || lowerName.includes('kertas 2') || lowerName.includes('p2') || lowerName.includes('paper 2');
          let isKertas3 = lowerName.includes('k3') || lowerName.includes('kertas 3') || lowerName.includes('p3') || lowerName.includes('paper 3');

          if (isKertas3) paperType = 'Kertas 3';
          else if (isKertas2) paperType = 'Kertas 2';
          else if (isKertas1) paperType = 'Kertas 1';

          let isSkema = lowerName.includes('jawapan') || lowerName.includes('skema') || lowerName.includes('answer') || lowerName.includes('scheme') || lowerName.includes('skm');
          if (isSkema) {
            paperType = 'Skema ' + paperType;
          }

          let cleanTitle = link.name;
          if (cleanTitle.toLowerCase().endsWith('.pdf')) {
            cleanTitle = cleanTitle.slice(0, -4).trim();
          }

          // B. Upload to Supabase Storage
          const fileName = `${SUBJECT_ID}/${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`;
          console.log(`Uploading to Supabase Storage as ${fileName}...`);

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('exam-papers')
            .upload(fileName, pdfBuffer, {
              contentType: 'application/pdf',
            });

          if (uploadError) throw uploadError;

          // C. Insert into Database
          console.log(`Inserting record into 'papers' table...`);
          const { error: dbError } = await supabase.from('papers').insert({
            subject_id: SUBJECT_ID,
            title: cleanTitle,
            year: YEAR,
            file_path: uploadData.path,
            negeri: negeri,
            paper_type: paperType
          });

          if (dbError) throw dbError;

          console.log(`✅ Successfully added: ${link.name}`);

        } catch (err) {
          console.error(`❌ Failed to process ${link.name}:`, err.message);
        }
      }

      console.log(`\n🎉 Scraping completed for: ${TARGET_URL}`);

    } catch (err) {
      console.error(`Error fetching target URL ${TARGET_URL}:`, err.message);
    }
  }

  console.log('\n🚀 All scraping tasks completed!');
}

// Run the script
runScraper();
