"""Unit Test Suite for NCBI Remote BLAST Service (backend/services/blast_service.py).

Tests:
- Valid DNA input validation
- Invalid DNA character rejection
- Empty DNA sequence rejection
- Excessive DNA length rejection
- Whitespace and FASTA header normalization
- XML parsing of valid NCBI BLAST XML response
- XML parsing of empty BLAST hit records
- Malformed XML exception handling
- Response formatting
- Async execute_blast_search with timeout/failure protection
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

import pytest

# Ensure root workspace directory is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.services.blast_service import (
    execute_blast_search,
    format_response,
    parse_results,
    validate_blast_sequence,
)

SAMPLE_VALID_XML = """<?xml version="1.0"?>
<!DOCTYPE BlastOutput PUBLIC "-//NCBI//NCBI BlastOutput/EN" "http://www.ncbi.nlm.nih.gov/dtd/NCBI_BlastOutput.dtd">
<BlastOutput>
  <BlastOutput_program>blastn</BlastOutput_program>
  <BlastOutput_version>BLASTN 2.15.0+</BlastOutput_version>
  <BlastOutput_reference>Stephen F. Altschul et al.</BlastOutput_reference>
  <BlastOutput_db>nt</BlastOutput_db>
  <BlastOutput_query-ID>Query_1</BlastOutput_query-ID>
  <BlastOutput_query-def>201bp DNA sequence</BlastOutput_query-def>
  <BlastOutput_query-len>201</BlastOutput_query-len>
  <BlastOutput_param>
    <Parameters>
      <Parameters_expect>10</Parameters_expect>
      <Parameters_sc-match>1</Parameters_sc-match>
      <Parameters_sc-mismatch>-2</Parameters_sc-mismatch>
      <Parameters_gap-open>0</Parameters_gap-open>
      <Parameters_gap-extend>0</Parameters_gap-extend>
      <Parameters_filter>L;m;</Parameters_filter>
    </Parameters>
  </BlastOutput_param>
  <BlastOutput_iterations>
    <Iteration>
      <Iteration_iter-num>1</Iteration_iter-num>
      <Iteration_query-ID>Query_1</Iteration_query-ID>
      <Iteration_query-def>201bp DNA sequence</Iteration_query-def>
      <Iteration_query-len>201</Iteration_query-len>
      <Iteration_hits>
        <Hit>
          <Hit_num>1</Hit_num>
          <Hit_id>gi|1885888|ref|NM_007294.4|</Hit_id>
          <Hit_def>Homo sapiens BRCA1 DNA repair associated (BRCA1), mRNA</Hit_def>
          <Hit_accession>NM_007294</Hit_accession>
          <Hit_len>7224</Hit_len>
          <Hit_hsps>
            <Hsp>
              <Hsp_num>1</Hsp_num>
              <Hsp_bit-score>402.125</Hsp_bit-score>
              <Hsp_score>201</Hsp_score>
              <Hsp_evalue>0</Hsp_evalue>
              <Hsp_query-from>1</Hsp_query-from>
              <Hsp_query-to>201</Hsp_query-to>
              <Hsp_hit-from>1000</Hsp_hit-from>
              <Hsp_hit-to>1200</Hsp_hit-to>
              <Hsp_query-frame>1</Hsp_query-frame>
              <Hsp_hit-frame>1</Hsp_hit-frame>
              <Hsp_identity>201</Hsp_identity>
              <Hsp_positive>201</Hsp_positive>
              <Hsp_gaps>0</Hsp_gaps>
              <Hsp_align-len>201</Hsp_align-len>
              <Hsp_qseq>AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC</Hsp_qseq>
              <Hsp_hseq>AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC</Hsp_hseq>
              <Hsp_midline>|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||</Hsp_midline>
            </Hsp>
          </Hit_hsps>
        </Hit>
      </Iteration_hits>
      <Iteration_stat>
        <Statistics>
          <Statistics_db-num>90000000</Statistics_db-num>
          <Statistics_db-len>400000000000</Statistics_db-len>
          <Statistics_hsp-len>0</Statistics_hsp-len>
          <Statistics_eff-space>0</Statistics_eff-space>
          <Statistics_kappa>0.0</Statistics_kappa>
          <Statistics_lambda>0.0</Statistics_lambda>
          <Statistics_entropy>0.0</Statistics_entropy>
        </Statistics>
      </Iteration_stat>
    </Iteration>
  </BlastOutput_iterations>
</BlastOutput>
"""

SAMPLE_EMPTY_HITS_XML = """<?xml version="1.0"?>
<!DOCTYPE BlastOutput PUBLIC "-//NCBI//NCBI BlastOutput/EN" "http://www.ncbi.nlm.nih.gov/dtd/NCBI_BlastOutput.dtd">
<BlastOutput>
  <BlastOutput_program>blastn</BlastOutput_program>
  <BlastOutput_version>BLASTN 2.15.0+</BlastOutput_version>
  <BlastOutput_reference>Stephen F. Altschul et al.</BlastOutput_reference>
  <BlastOutput_db>nt</BlastOutput_db>
  <BlastOutput_query-ID>Query_1</BlastOutput_query-ID>
  <BlastOutput_query-def>201bp DNA sequence</BlastOutput_query-def>
  <BlastOutput_query-len>201</BlastOutput_query-len>
  <BlastOutput_param>
    <Parameters>
      <Parameters_expect>10</Parameters_expect>
      <Parameters_sc-match>1</Parameters_sc-match>
      <Parameters_sc-mismatch>-2</Parameters_sc-mismatch>
      <Parameters_gap-open>0</Parameters_gap-open>
      <Parameters_gap-extend>0</Parameters_gap-extend>
      <Parameters_filter>L;m;</Parameters_filter>
    </Parameters>
  </BlastOutput_param>
  <BlastOutput_iterations>
    <Iteration>
      <Iteration_iter-num>1</Iteration_iter-num>
      <Iteration_query-ID>Query_1</Iteration_query-ID>
      <Iteration_query-def>201bp DNA sequence</Iteration_query-def>
      <Iteration_query-len>201</Iteration_query-len>
      <Iteration_hits>
      </Iteration_hits>
      <Iteration_stat>
        <Statistics>
          <Statistics_db-num>90000000</Statistics_db-num>
          <Statistics_db-len>400000000000</Statistics_db-len>
          <Statistics_hsp-len>0</Statistics_hsp-len>
          <Statistics_eff-space>0</Statistics_eff-space>
          <Statistics_kappa>0.0</Statistics_kappa>
          <Statistics_lambda>0.0</Statistics_lambda>
          <Statistics_entropy>0.0</Statistics_entropy>
        </Statistics>
      </Iteration_stat>
    </Iteration>
  </BlastOutput_iterations>
</BlastOutput>
"""


def test_validate_blast_sequence_valid():
    seq = "A" * 50 + "T" * 50 + "G" * 50 + "C" * 50 + "A"
    res = validate_blast_sequence(seq)
    assert len(res) == 201
    assert res.isupper()


def test_validate_blast_sequence_fasta_header():
    fasta = ">header_seq_1\natgc\natgc"
    res = validate_blast_sequence(fasta)
    assert res == "ATGCATGC"


def test_validate_blast_sequence_rejects_invalid_chars():
    with pytest.raises(ValueError, match="Invalid nucleotide 'X'"):
        validate_blast_sequence("ATGCXATGC")


def test_validate_blast_sequence_rejects_empty():
    with pytest.raises(ValueError, match="non-empty string"):
        validate_blast_sequence("")

    with pytest.raises(ValueError, match="cannot be empty"):
        validate_blast_sequence("   \n\t  ")


def test_validate_blast_sequence_rejects_excessive_length():
    long_seq = "A" * 5001
    with pytest.raises(ValueError, match="exceeds maximum allowed length"):
        validate_blast_sequence(long_seq)


def test_parse_results_valid_xml():
    parsed = parse_results(SAMPLE_VALID_XML, query_len=201)
    assert parsed["status"] == "completed"
    assert parsed["query_length"] == 201
    top_hit = parsed["top_hit"]
    assert top_hit is not None
    assert top_hit["accession"] == "NM_007294"
    assert top_hit["gene"] == "BRCA1"
    assert top_hit["organism"] == "Homo sapiens"
    assert top_hit["identity"] == 100.0
    assert top_hit["coverage"] == 100.0
    assert top_hit["alignment_length"] == 201
    assert top_hit["bit_score"] == 402.1
    assert top_hit["evalue"] == "0.0"
    assert "BRCA1" in top_hit["description"]
    assert top_hit["ncbi_url"] == "https://www.ncbi.nlm.nih.gov/nuccore/NM_007294"


def test_parse_results_empty_hits():
    parsed = parse_results(SAMPLE_EMPTY_HITS_XML, query_len=201)
    assert parsed["status"] == "completed"
    assert parsed["top_hit"] is None
    assert "No matching sequence alignments found" in parsed["message"]


def test_parse_results_malformed_xml():
    with pytest.raises(ValueError, match="Failed to parse BLAST XML"):
        parse_results("INVALID XML CONTENT <foo", query_len=201)


def test_format_response_completed():
    raw_data = {
        "status": "completed",
        "query_length": 201,
        "top_hit": {"gene": "BRCA1", "accession": "NM_007294"},
    }
    formatted = format_response(raw_data, execution_time_ms=120.5)
    assert formatted["status"] == "completed"
    assert formatted["query_length"] == 201
    assert formatted["execution_time_ms"] == 120.5
    assert formatted["top_hit"]["gene"] == "BRCA1"


def test_execute_blast_search_invalid_dna():
    res = asyncio.run(execute_blast_search("INVALID_DNA_X"))
    assert res["status"] == "failed"
    assert "Invalid nucleotide" in res["error"]
    assert res["top_hit"] is None


def test_execute_blast_search_timeout_fallback(monkeypatch):
    """Test timeout fallback protection when NCBI server hangs."""

    def mock_run_blast(seq):
        import time

        time.sleep(0.01)
        return ""

    monkeypatch.setattr("backend.services.blast_service.run_blast", mock_run_blast)

    async def mock_wait_for(*args, **kwargs):
        raise asyncio.TimeoutError()

    monkeypatch.setattr(asyncio, "wait_for", mock_wait_for)
    seq = "A" * 50 + "T" * 50 + "G" * 50 + "C" * 50 + "A"
    res = asyncio.run(execute_blast_search(seq, timeout=0.1))

    assert res["status"] == "failed"
    assert "timed out" in res["error"]
    assert res["top_hit"] is None
