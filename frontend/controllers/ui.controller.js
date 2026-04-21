/**
 * View / UI Layer (MVC)
 * Strictly isolates DOM manipulation.
 */

class UIManager {
    
    // --- State Switching ---
    static resetUI() {
        document.getElementById('section-pipeline').style.display = 'none';
        document.getElementById('section-results').style.display = 'none';
        
        // Reset steps
        for(let i=1; i<=3; i++) {
            const step = document.getElementById(`step${i}`);
            step.className = 'pipeline-step pending';
        }
    }

    static showUploadState() {
        this.resetUI();
    }

    static animatePipelineSteps() {
        // Show the pipeline container
        document.getElementById('section-pipeline').style.display = 'block';

        // Animate Step 1 (OOD Check)
        setTimeout(() => {
            document.getElementById('step1').className = 'pipeline-step active';
        }, 100);

        setTimeout(() => {
            document.getElementById('step1').className = 'pipeline-step success';
            // Start Step 2 (Classification)
            document.getElementById('step2').className = 'pipeline-step active';
        }, 800);
    }

    static throwPipelineError() {
        // Usually OOD fails at Step 1 or model fails at step 2
        document.getElementById('step2').className = 'pipeline-step error';
    }

    static showSuccessState(data, imageUrl, filename = 'medical_scan.jpg') {
        
        // Finalize Step 2 & 3 in UI
        document.getElementById('step2').className = 'pipeline-step success';
        document.getElementById('step3').className = 'pipeline-step active';
        
        setTimeout(() => {
            document.getElementById('step3').className = 'pipeline-step success';
            
            // Map Result Data
            let mainType = data.prediction ? data.prediction : (data.main_class || 'Unknown');
            document.getElementById('res-name-text').innerText = mainType;
            
            const isCancer = !mainType.toLowerCase().includes('benign') && !mainType.toLowerCase().includes('normal');
            
            const innerBox = document.getElementById('inner-result-box');
            if(isCancer) innerBox.classList.add('danger');
            else innerBox.classList.remove('danger');

            const percRaw = data.confidence || 0;
            const perc = (percRaw * 100).toFixed(1);
            document.getElementById('res-perc-text').innerText = `${perc}%`;
            
            // Draw Circle
            const circleLine = document.getElementById('res-circle-line');
            if(isCancer) circleLine.classList.add('error');
            else circleLine.classList.remove('error');
            
            // 251.2 is full dasharray length for r=40
            const offset = 251.2 - ((percRaw) * 251.2);
            
            const oodBanner = document.getElementById('ood-banner');
            oodBanner.className = 'result-valid-box';
            oodBanner.innerText = `Valid Medical Image (${(data.ood_score || 0).toFixed(2)})`;
            document.getElementById('analysis-msg').innerText = 'Analysis successful.';

            const rId = `IMG-${Math.random().toString().substr(2, 6).toUpperCase()}`;
            const d = new Date();
            const dateStr = d.toLocaleString('en-US');

            // Populate Main UI Panel Data
            document.getElementById('ui-res-id').innerText = rId;
            document.getElementById('ui-res-filename').innerText = filename;
            document.getElementById('ui-res-date').innerText = dateStr;

            // Populate PDF Template Data
            document.getElementById('pdf-id').innerText = rId;
            document.getElementById('pdf-filename').innerText = filename;
            document.getElementById('pdf-date').innerText = dateStr;
            document.getElementById('pdf-result-text').innerText = mainType;
            document.getElementById('pdf-conf-text').innerText = `${perc}%`;
            document.getElementById('pdf-conf-fill').setAttribute('data-value', Math.round(percRaw * 100));

            // Reveal Results Section
            document.getElementById('section-results').style.display = 'block';
            
            // Give a tiny delay for CSS transition to compute offset
            setTimeout(() => {
                circleLine.style.strokeDashoffset = offset;
            }, 50);

        }, 600); // Step 3 takes 600ms
    }

    static showErrorState(data, imageUrl, filename = 'medical_scan.jpg') {
        
        this.throwPipelineError();
        
        setTimeout(() => {
            document.getElementById('res-name-text').innerText = "Unknown / Unrecognized";
            document.getElementById('inner-result-box').classList.add('danger');
            
            document.getElementById('res-perc-text').innerText = `0.0%`;
            
            const circleLine = document.getElementById('res-circle-line');
            circleLine.classList.add('error');
            const offset = 251.2; // 0%
            
            const oodBanner = document.getElementById('ood-banner');
            oodBanner.className = 'result-invalid-box';
            oodBanner.innerText = `Invalid Image - Failed Validation (${(data.ood_score || 0).toFixed(2)})`;
            document.getElementById('analysis-msg').innerText = 'Analysis Failed.';

            const rId = `IMG-${Math.random().toString().substr(2, 6).toUpperCase()}`;
            const d = new Date();
            const dateStr = d.toLocaleString('en-US');

            // UI
            document.getElementById('ui-res-id').innerText = rId;
            document.getElementById('ui-res-filename').innerText = filename;
            document.getElementById('ui-res-date').innerText = dateStr;

            // PDF
            document.getElementById('pdf-id').innerText = rId;
            document.getElementById('pdf-filename').innerText = filename;
            document.getElementById('pdf-date').innerText = dateStr;
            document.getElementById('pdf-result-text').innerText = 'Invalid Output';
            document.getElementById('pdf-conf-text').innerText = '0%';
            document.getElementById('pdf-conf-fill').setAttribute('data-value', 0);

            document.getElementById('section-results').style.display = 'block';
            
            setTimeout(() => {
                circleLine.style.strokeDashoffset = offset;
            }, 50);

        }, 500);
    }

    // --- Upload UI Modifications ---
    static enablePredictButton() {
        const btn = document.getElementById('btn-process');
        if(btn) {
            btn.disabled = false;
            btn.innerText = 'Analyze Scan';
        }
    }

    static disablePredictButton(text = 'Processing...') {
        const btn = document.getElementById('btn-process');
        if(btn) {
            btn.disabled = true;
            btn.innerText = text;
        }
    }

    static showImagePreview(fileObj) {
        this.resetUI(); // Clear old results

        const previewBlock = document.getElementById('preview-area');
        const imgEl = document.getElementById('preview-img');
        previewBlock.style.display = 'block';

        const reader = new FileReader();
        reader.onload = (e) => {
            imgEl.src = e.target.result;
        };
        reader.readAsDataURL(fileObj);
    }
}
