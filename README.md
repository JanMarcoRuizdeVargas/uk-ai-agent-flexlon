# FlexLon: The Flex Point Between Compute and Energy

<div style="padding: 20px;">
  <img src="CnP_25112025_024456.png" alt="FlexLon Architecture" width="600"/>
</div>

## Overview
FlexLon is an agentic orchestration ecosystem for data centre operators to optimise flexibility, generate new P415 protocol revenue, reduce energy costs, and lower carbon. It treats AI and data-centre workloads as flexible grid-aware energy assets coordinated through the Digital Energy Grid and the Beckn Protocol.

## Technical Architecture
The system has three core agent types:

1. Compute-Flex Agents sit alongside schedulers, ingest jobs and SLOs, and translate them into machine-readable flexibility offers published as Beckn catalogue items.
2. Grid Orchestrator Agent runs on the DEG/UEI network, ingests grid signals and initiates Beckn searches to match optimisation criteria such as low price or low carbon.
3. Flexibility Orchestrator Agent sits with the operator, aggregates flexibility signals across compute and other assets, and uses a hybrid optimisation engine to minimise cost per inference under carbon and latency constraints.

Agents coordinate using the standard Beckn order lifecycle: search, select, confirm, on_confirm, status.

## Strategic Impact
FlexLon delivers value by enabling monetisation of compute flexibility in emerging P415 markets, reducing energy Opex through dynamic workload shifting, enabling carbon-aware scheduling for sustainability targets, and improving resilience by routing workloads during grid stress.

The system generates DEG-aligned audit logs for P444 settlement and compliance.

## Implementation Details
A Python and Flask implementation demonstrates the Beckn workflow steps including discover, select, initialise, confirm, status, update_workload, and rating. Optimisation ranks generators by a combined price and carbon score.

## Team and Licensing
Team: Mezzanine Hackers  
Organisations: University of Cambridge, Imperial College London, Technical University of Munich  
License: MIT Commons
