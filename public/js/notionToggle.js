// Add JavaScript to toggle between database and page views
document.addEventListener('DOMContentLoaded', function() {
  // Export format toggle
  const exportFormatSelector = document.getElementById('exportFormatSelector');
  const databaseExportSection = document.getElementById('databaseExportSection');
  const pageExportSection = document.getElementById('pageExportSection');
  
  if (exportFormatSelector) {
    exportFormatSelector.addEventListener('change', function() {
      if (this.value === 'database') {
        databaseExportSection.classList.remove('hidden');
        pageExportSection.classList.add('hidden');
      } else {
        databaseExportSection.classList.add('hidden');
        pageExportSection.classList.remove('hidden');
      }
    });
  }
  
  // Create type toggle
  const createTypeSelector = document.getElementById('createTypeSelector');
  const databaseCreateSection = document.getElementById('databaseCreateSection');
  const pageCreateSection = document.getElementById('pageCreateSection');
  
  if (createTypeSelector) {
    createTypeSelector.addEventListener('change', function() {
      if (this.value === 'database') {
        databaseCreateSection.classList.remove('hidden');
        pageCreateSection.classList.add('hidden');
      } else {
        databaseCreateSection.classList.add('hidden');
        pageCreateSection.classList.remove('hidden');
      }
    });
  }
});
