<?php

require __DIR__.'/../../vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

$s = new Spreadsheet;
$sh = $s->getActiveSheet();
$sh->fromArray([
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    ['Statut', 'Availability', 'Alternative', 'Category', 'ean13', 'Référence', 'Pic', 'Designation FR', 'Prix Web Site'],
    [null, null, null, "REPAS\nMEALTIME", '3384349127738', '912773', null, 'Babycook Neo Grey/white', 66700],
    [null, null, null, "REPAS\nMEALTIME", '3384349127721', '912772', null, 'Babycook Neo Night Blue', 66700],
    [null, null, null, "REPAS\nMEALTIME", '3384349127325', '912732', null, 'Babycook Neo Eucalyptus', 66700],
    ['STOP', 'while stocks', null, "REPAS\nMEALTIME", '3384349163001', '916300', null, 'Babycook Express Gris Velours', 45000],
    ['Exclu Retail', null, null, "MAISON\nHOME", '3384349999001', '999901', null, 'Assiette silicone ventouse - Galet', 3200],
    ['Onliners', null, null, "MAISON\nHOME", '3384349999002', '999902', null, 'Assiette silicone ventouse - light blue', 3200],
    ['RUNNING CHANGE', null, 'REPLACEMENT: 913609', "REPAS\nMEALTIME", '3384349134303', '913430', null, 'Assiette silicone ventouse - blue', 3100],
    [null, null, null, "REPAS\nMEALTIME", '3384349134303', '913609', null, 'Assiette silicone ventouse - Galet', 3100],
    [null, null, null, "BIBERONNERIE\nBABY BOTTLES", '3384349111111', '911111', null, 'Biberon 210 ml sans couleur', 2500],
], null, 'A1');

$writer = new Xlsx($s);
$writer->save(__DIR__.'/beaba-sample.xlsx');

echo "fixture ok\n";
