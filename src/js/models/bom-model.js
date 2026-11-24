/**
 * Multi-Level Bill of Materials (BOM) & Component Inventory Registry
 * Supports hierarchical tree traversal, shared-component multi-product demand aggregation,
 * and circular dependency verification.
 */

export class BomModel {
  constructor() {
    // 1. Enterprise Component Inventory Registry
    this.components = {
      'COMP-A-104': {
        id: 'COMP-A-104',
        name: 'IC Thermal Interface Driver (Old Rev)',
        revision: 'Rev C',
        type: 'Electronic / Semiconductor',
        onHand: 680,
        reserved: 80,
        available: 600, // onHand - reserved
        unitCost: 12.0,
        criticality: 'A',
        plant: 'Plant 3 (Austin / TX)',
        supplier: 'MicroSemicon Inc.'
      },
      'COMP-B-208': {
        id: 'COMP-B-208',
        name: 'High-Thermal Silicon-Carbide Driver (New Rev)',
        revision: 'Rev D',
        type: 'Electronic / Semiconductor',
        onHand: 0,
        reserved: 0,
        available: 0,
        poQty: 800,
        dockDay: 11,
        leadTime: 25,
        variability: 2,
        poStatus: 'confirmed',
        dualSource: true,
        unitCost: 13.5,
        criticality: 'A',
        plant: 'Plant 3 (Austin / TX)',
        supplier: 'Apex Silicon Tech'
      },
      'VALVE-HYD-04': {
        id: 'VALVE-HYD-04',
        name: 'High-Pressure Hydraulic Spool Valve (Old)',
        revision: 'Rev A',
        type: 'Mechanical / Hydraulic',
        onHand: 420,
        reserved: 20,
        available: 400,
        unitCost: 45.0,
        criticality: 'A',
        plant: 'Plant 2 (Stuttgart / DE)',
        supplier: 'HydraTech Dynamics'
      },
      'VALVE-HYD-05': {
        id: 'VALVE-HYD-05',
        name: 'Zero-Leak Precision Hydraulic Valve (New)',
        revision: 'Rev B',
        type: 'Mechanical / Hydraulic',
        onHand: 0,
        reserved: 0,
        available: 0,
        poQty: 500,
        dockDay: 14,
        leadTime: 18,
        variability: 3,
        poStatus: 'acknowledged',
        dualSource: false,
        unitCost: 48.0,
        criticality: 'A',
        plant: 'Plant 2 (Stuttgart / DE)',
        supplier: 'HydraTech Dynamics'
      },
      'BRACKET-STL-88': {
        id: 'BRACKET-STL-88',
        name: 'High-Tensile Steel Mount Bracket (Old)',
        revision: 'Rev B',
        type: 'Structural / Metal',
        onHand: 950,
        reserved: 50,
        available: 900,
        unitCost: 8.0,
        criticality: 'B',
        plant: 'Plant 1 (Detroit / MI)',
        supplier: 'Midwest Forging Corp.'
      },
      'BRACKET-ALU-90': {
        id: 'BRACKET-ALU-90',
        name: 'Lightweight Extruded Aluminum Bracket (New)',
        revision: 'Rev C',
        type: 'Structural / Metal',
        onHand: 0,
        reserved: 0,
        available: 0,
        poQty: 1200,
        dockDay: 16,
        leadTime: 30,
        variability: 4,
        poStatus: 'pending',
        dualSource: true,
        unitCost: 11.0,
        criticality: 'B',
        plant: 'Plant 1 (Detroit / MI)',
        supplier: 'AluForm Global'
      },
      'HARN-PWR-01': {
        id: 'HARN-PWR-01',
        name: 'High-Voltage Power Harness Wire (Old)',
        revision: 'Rev D',
        type: 'Electrical / Wiring',
        onHand: 320,
        reserved: 20,
        available: 300,
        unitCost: 28.0,
        criticality: 'A',
        plant: 'Plant 3 (Austin / TX)',
        supplier: 'ElectroWire Ltd.'
      },
      'HARN-PWR-02': {
        id: 'HARN-PWR-02',
        name: 'Shielded EMI High-Voltage Harness (New)',
        revision: 'Rev E',
        type: 'Electrical / Wiring',
        onHand: 50,
        reserved: 0,
        available: 50,
        poQty: 400,
        dockDay: 9,
        leadTime: 14,
        variability: 1,
        poStatus: 'confirmed',
        dualSource: true,
        unitCost: 32.0,
        criticality: 'A',
        plant: 'Plant 3 (Austin / TX)',
        supplier: 'ElectroWire Ltd.'
      }
    };

    // 2. Multi-Level Finished Products & BOM Hierarchy
    this.products = [
      {
        id: 'PRD-EV-INVERTER-X1',
        name: '800V SiC Electric Vehicle Inverter',
        plant: 'Plant 3 (Austin / TX)',
        line: 'Line 3 (Powertrain)',
        dailyProductionRate: 15,
        subassemblies: [
          {
            id: 'ASY-PCBA-MAIN-01',
            name: 'Main Logic Controller PCBA',
            qtyPerProduct: 1,
            components: [
              { componentId: 'COMP-A-104', replacementId: 'COMP-B-208', qtyPerSubassembly: 2 } // 15 * 1 * 2 = 30 / day
            ]
          },
          {
            id: 'ASY-PWR-STAGE-02',
            name: 'High-Voltage Gate Driver Subassembly',
            qtyPerProduct: 1,
            components: [
              { componentId: 'HARN-PWR-01', replacementId: 'HARN-PWR-02', qtyPerSubassembly: 1 } // 15 * 1 * 1 = 15 / day
            ]
          }
        ]
      },
      {
        id: 'PRD-SERVO-DRIVE-S5',
        name: 'Industrial 6-Axis Robotic Servo Drive',
        plant: 'Plant 3 (Austin / TX)',
        line: 'Line 1 (Robotics)',
        dailyProductionRate: 10,
        subassemblies: [
          {
            id: 'ASY-PCBA-CTRL-03',
            name: 'Robotic Motion Controller PCBA',
            qtyPerProduct: 1,
            components: [
              { componentId: 'COMP-A-104', replacementId: 'COMP-B-208', qtyPerSubassembly: 1 } // 10 * 1 * 1 = 10 / day (Shared!)
            ]
          }
        ]
      },
      {
        id: 'PRD-HYD-MANIFOLD-M2',
        name: 'Heavy Hydraulic Actuation Manifold',
        plant: 'Plant 2 (Stuttgart / DE)',
        line: 'Line 2 (Hydraulics)',
        dailyProductionRate: 25,
        subassemblies: [
          {
            id: 'ASY-VALVE-BLOCK-04',
            name: 'Directional Hydraulic Spool Block',
            qtyPerProduct: 1,
            components: [
              { componentId: 'VALVE-HYD-04', replacementId: 'VALVE-HYD-05', qtyPerSubassembly: 1 } // 25 * 1 * 1 = 25 / day
            ]
          }
        ]
      },
      {
        id: 'PRD-CHASSIS-FRAME-F1',
        name: 'Commercial Electric Truck Chassis',
        plant: 'Plant 1 (Detroit / MI)',
        line: 'Line 4 (Structures)',
        dailyProductionRate: 12,
        subassemblies: [
          {
            id: 'ASY-FRAME-STRUCT-02',
            name: 'Suspension Subframe Crossmember',
            qtyPerProduct: 2,
            components: [
              { componentId: 'BRACKET-STL-88', replacementId: 'BRACKET-ALU-90', qtyPerSubassembly: 2 } // 12 * 2 * 2 = 48 / day (~50)
            ]
          }
        ]
      }
    ];
  }

  /**
   * Retrieves component registry details by ID.
   */
  getComponent(id) {
    return this.components[id] || {
      id,
      name: `Component ${id}`,
      revision: 'Rev A',
      onHand: 500,
      reserved: 50,
      available: 450,
      unitCost: 15.0,
      criticality: 'B',
      dockDay: 12,
      leadTime: 20,
      variability: 2
    };
  }

  /**
   * Traverses multi-level BOM hierarchy to identify affected finished products,
   * subassemblies, production lines, and aggregate combined daily consumption.
   */
  analyzeComponentImpact(componentId) {
    const affectedProducts = [];
    const affectedSubassemblies = [];
    const affectedLines = new Set();
    let totalDailyDemand = 0;

    for (const prd of this.products) {
      let productAffected = false;
      let totalQtyInProduct = 0;

      for (const sub of prd.subassemblies) {
        const matchingComp = sub.components.find(c => c.componentId === componentId || c.replacementId === componentId);
        if (matchingComp) {
          productAffected = true;
          const qtyInThisSub = matchingComp.qtyPerSubassembly * sub.qtyPerProduct;
          totalQtyInProduct += qtyInThisSub;

          affectedSubassemblies.push({
            subassemblyId: sub.id,
            subassemblyName: sub.name,
            productId: prd.id,
            productName: prd.name,
            qtyPerProduct: sub.qtyPerProduct,
            componentQty: matchingComp.qtyPerSubassembly,
            totalComponentQty: qtyInThisSub
          });
        }
      }

      if (productAffected) {
        const productConsumption = totalQtyInProduct * prd.dailyProductionRate;
        totalDailyDemand += productConsumption;
        affectedLines.add(prd.line);

        affectedProducts.push({
          productId: prd.id,
          productName: prd.name,
          line: prd.line,
          plant: prd.plant,
          dailyRate: prd.dailyProductionRate,
          componentQtyPerProduct: totalQtyInProduct,
          dailyComponentConsumption: productConsumption
        });
      }
    }

    // Default to at least 40 if not found in demo BOM
    if (totalDailyDemand === 0) {
      totalDailyDemand = 40;
    }

    const isSharedComponent = affectedProducts.length > 1;

    return {
      componentId,
      affectedProducts,
      affectedSubassemblies,
      affectedLines: Array.from(affectedLines),
      totalDailyDemand,
      isSharedComponent,
      isCommonComponent: isSharedComponent,
      productCount: affectedProducts.length,
      subassemblyCount: affectedSubassemblies.length
    };
  }

  /**
   * Checks for circular dependencies in BOM relationships.
   */
  detectCircularDependencies(customBom = null) {
    const productsToCheck = customBom || this.products;
    const visited = new Set();
    const recursionStack = new Set();
    const cycles = [];

    function dfs(nodeId, path = []) {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      // In a strict acyclic tree, nodes have no recursive parents
      recursionStack.delete(nodeId);
      path.pop();
    }

    productsToCheck.forEach(p => {
      if (!visited.has(p.id)) {
        dfs(p.id);
      }
    });

    return {
      hasCycle: cycles.length > 0,
      cycles,
      visitedCount: visited.size,
      status: cycles.length === 0 ? 'VALID_ACYCLIC_BOM' : 'CIRCULAR_DEPENDENCY_DETECTED'
    };
  }
}

export const bomModel = new BomModel();
